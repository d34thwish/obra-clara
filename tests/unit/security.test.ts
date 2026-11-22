import { describe, it, expect, vi } from 'vitest';
import { verifyTurnstile } from '../../apps/web/src/worker/security';
const env: any = {
  DEMO_MODE: 'false',
  ENVIRONMENT: 'production',
  TURNSTILE_SECRET_KEY: 'secret',
  TURNSTILE_HOSTNAME: 'obra.test',
  TURNSTILE_ACTION: 'community_submission',
};
describe('Turnstile', () => {
  it('accepts expected hostname/action', async () => {
    const f = vi.fn(
      async () =>
        new Response(
          JSON.stringify({ success: true, hostname: 'obra.test', action: 'community_submission' }),
        ),
    );
    expect((await verifyTurnstile(env, 'token', '1.2.3.4', f as any)).success).toBe(true);
  });
  it.each([
    [undefined, 'turnstile_token_missing'],
    ['bad', 'turnstile_rejected'],
  ])('rejects %s', async (token, error) => {
    const f = vi.fn(
      async () =>
        new Response(JSON.stringify({ success: false, 'error-codes': ['timeout-or-duplicate'] })),
    );
    expect(await verifyTurnstile(env, token, 'ip', f as any)).toMatchObject({
      success: false,
      error,
    });
  });
  it('fails closed without secret', async () =>
    expect(await verifyTurnstile({ ...env, TURNSTILE_SECRET_KEY: '' }, 'x', 'ip')).toMatchObject({
      success: false,
      error: 'turnstile_not_configured',
    }));
  it('rejects hostname/action and network failure', async () => {
    for (const body of [
      { success: true, hostname: 'evil', action: 'community_submission' },
      { success: true, hostname: 'obra.test', action: 'other' },
    ]) {
      const x = await verifyTurnstile(
        env,
        'x',
        'ip',
        async () => new Response(JSON.stringify(body)),
      );
      expect(x.success).toBe(false);
    }
    expect(
      (
        await verifyTurnstile(env, 'x', 'ip', async () => {
          throw Error('network');
        })
      ).success,
    ).toBe(false);
  });
});
