import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { Context, Next } from 'hono';
import type { Env, Auth } from './types';
export async function verifyTurnstile(
  env: Env,
  token: string | undefined,
  ip: string,
  fetcher: typeof fetch = fetch,
) {
  if (
    env.DEMO_MODE === 'true' &&
    env.ENVIRONMENT === 'development' &&
    env.TURNSTILE_DEV_BYPASS === 'true'
  )
    return { success: true, development: true };
  if (!env.TURNSTILE_SECRET_KEY) return { success: false, error: 'turnstile_not_configured' };
  if (!token) return { success: false, error: 'turnstile_token_missing' };
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const body = new URLSearchParams({
      secret: env.TURNSTILE_SECRET_KEY,
      response: token,
      remoteip: ip,
      idempotency_key: crypto.randomUUID(),
    });
    const response = await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) return { success: false, error: 'turnstile_service_error' };
    const result = (await response.json()) as {
      success: boolean;
      hostname?: string;
      action?: string;
      'error-codes'?: string[];
    };
    if (!result.success)
      return { success: false, error: 'turnstile_rejected', codes: result['error-codes'] };
    if (env.TURNSTILE_HOSTNAME && result.hostname !== env.TURNSTILE_HOSTNAME)
      return { success: false, error: 'turnstile_hostname_mismatch' };
    if (env.TURNSTILE_ACTION && result.action !== env.TURNSTILE_ACTION)
      return { success: false, error: 'turnstile_action_mismatch' };
    return { success: true };
  } catch {
    return { success: false, error: 'turnstile_service_error' };
  }
}
export async function requireModerator(
  c: Context<{ Bindings: Env; Variables: { auth: Auth } }>,
  next: Next,
) {
  const env = c.env;
  if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD || !env.MODERATOR_EMAILS)
    return c.json(
      { error: 'admin_not_configured', message: 'La administración no está configurada.' },
      403,
    );
  const token = c.req.header('Cf-Access-Jwt-Assertion');
  if (!token) return c.json({ error: 'unauthorized', message: 'Autenticación requerida.' }, 401);
  try {
    const issuer = env.ACCESS_TEAM_DOMAIN.startsWith('https://')
      ? env.ACCESS_TEAM_DOMAIN
      : `https://${env.ACCESS_TEAM_DOMAIN}`;
    const jwks = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`));
    const { payload } = await jwtVerify(token, jwks, {
      issuer,
      audience: env.ACCESS_AUD,
      algorithms: ['RS256'],
    });
    const email = String(payload.email || '').toLowerCase();
    const allow = new Set(
      env.MODERATOR_EMAILS.split(',')
        .map((x) => x.trim().toLowerCase())
        .filter(Boolean),
    );
    if (!email || !allow.has(email))
      return c.json({ error: 'forbidden', message: 'No tienes permisos de moderación.' }, 403);
    c.set('auth', { email, subject: String(payload.sub || email) });
    await next();
  } catch {
    return c.json({ error: 'unauthorized', message: 'Token de acceso inválido.' }, 401);
  }
}
