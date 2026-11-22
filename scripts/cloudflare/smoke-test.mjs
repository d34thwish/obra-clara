#!/usr/bin/env node
const routes = [
  '/',
  '/api/v1/health',
  '/api/v1/config',
  '/api/v1/overview',
  '/api/openapi.json',
  '/instituciones',
  '/proveedores',
  '/contrataciones',
  '/comunidad',
  '/datos',
];
const spaRoutes = new Set([
  '/',
  '/instituciones',
  '/proveedores',
  '/contrataciones',
  '/comunidad',
  '/datos',
]);
const accessRedirectStatuses = new Set([301, 302, 303, 307, 308]);

export function isProtectedAdminResponse(response, baseUrl) {
  if (response.status === 401 || response.status === 403) return true;
  if (!accessRedirectStatuses.has(response.status)) return false;

  const location = response.headers.get('location');
  if (!location) return false;

  try {
    const base = new URL(baseUrl);
    const redirect = new URL(location, baseUrl);
    if (redirect.protocol !== 'https:') return false;

    const isSameHostAccessLogin =
      redirect.hostname === base.hostname && redirect.pathname.startsWith('/cdn-cgi/access/login/');
    const isCloudflareAccessLogin =
      redirect.hostname.endsWith('.cloudflareaccess.com') &&
      redirect.pathname.startsWith('/cdn-cgi/access/login/');

    return isSameHostAccessLogin || isCloudflareAccessLogin;
  } catch {
    return false;
  }
}

export async function smokeTest(baseUrl = process.env.PUBLIC_BASE_URL, fetcher = fetch) {
  if (!baseUrl) throw new Error('PUBLIC_BASE_URL is required for smoke tests.');
  const failures = [];
  for (const path of routes) {
    let response;
    try {
      response = await fetcher(`${baseUrl}${path}`, {
        redirect: 'manual',
        signal: AbortSignal.timeout(15000),
      });
    } catch (e) {
      failures.push(`${path}: network error ${e.message}`);
      continue;
    }
    if (!response.ok) {
      failures.push(`${path}: HTTP ${response.status}`);
      continue;
    }
    if (spaRoutes.has(path)) {
      const html = await response.text();
      if (!html.includes('<div id="root"></div>'))
        failures.push(`${path}: response is not the SPA shell.`);
      if (/Modo demostraci[oó]n/i.test(html))
        failures.push(`${path}: demo notice found in production HTML.`);
    } else {
      const body = await response.json().catch(() => null);
      if (!body) {
        failures.push(`${path}: invalid JSON.`);
        continue;
      }
      if (path === '/api/v1/health' && (body.ok !== true || body.mode !== 'production'))
        failures.push(`${path}: expected ok=true and mode=production.`);
      if (
        path === '/api/v1/config' &&
        (body.mode !== 'production' || body.turnstileRequired !== true || !body.turnstileSiteKey)
      )
        failures.push(`${path}: production Turnstile configuration is incomplete.`);
      if (path === '/api/v1/overview' && body.meta?.mode !== 'production')
        failures.push(`${path}: production mode not reported.`);
    }
  }
  let admin;
  try {
    admin = await fetcher(`${baseUrl}/api/v1/admin/submissions`, {
      redirect: 'manual',
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    failures.push(`/api/v1/admin/submissions: network error ${error.message}`);
  }
  if (admin && !isProtectedAdminResponse(admin, baseUrl)) {
    failures.push(
      `/api/v1/admin/submissions: unexpected HTTP ${admin.status}; expected 401, 403, or a Cloudflare Access login redirect.`,
    );
  }
  if (failures.length)
    throw new Error(`Production smoke tests failed:\n- ${failures.join('\n- ')}`);
  console.log(
    `Production smoke tests passed for ${routes.length} public routes; admin remained protected.`,
  );
}
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href)
  smokeTest().catch((e) => {
    console.error(e.message);
    process.exitCode = 2;
  });
