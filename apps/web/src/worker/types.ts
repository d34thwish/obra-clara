export type Env = {
  DB: D1Database;
  RAW_DATA: R2Bucket;
  ASSETS: Fetcher;
  PUBLIC_RATE_LIMITER: RateLimit;
  SUBMISSION_RATE_LIMITER: RateLimit;
  DEMO_MODE: string;
  ENVIRONMENT: string;
  ACCESS_TEAM_DOMAIN: string;
  ACCESS_AUD: string;
  MODERATOR_EMAILS: string;
  TURNSTILE_SECRET_KEY?: string;
  TURNSTILE_SITE_KEY?: string;
  TURNSTILE_HOSTNAME?: string;
  TURNSTILE_ACTION?: string;
  CORS_ALLOWED_ORIGINS?: string;
  TURNSTILE_DEV_BYPASS?: string;
};
export type Auth = { email: string; subject: string };
