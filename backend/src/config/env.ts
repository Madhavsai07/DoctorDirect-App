import dotenv from 'dotenv';

// Load .env before any other module reads process.env
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
const databaseSslSetting = process.env.DATABASE_SSL;

if (databaseSslSetting && !['true', 'false'].includes(databaseSslSetting)) {
  throw new Error('DATABASE_SSL must be set to "true" or "false".');
}

if (process.env.NODE_ENV === 'production' && !databaseUrl) {
  throw new Error('DATABASE_URL is required in production.');
}

/**
 * Centralized environment configuration.
 *
 * All environment variables are read here so that the rest of the
 * application never accesses process.env directly. This makes it easy
 * to add validation, defaults, or type coercion in one place.
 *
 */
const config = {
  port: parseInt(process.env.PORT ?? '8000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',

  // ── Added in the Database milestone ──────────────────────────────────────
  databaseUrl,
  databaseSslEnabled: databaseSslSetting === 'true',
  databaseSslCa: process.env.DATABASE_SSL_CA,

  // ── Added in the Authentication milestone ────────────────────────────────
  supabaseUrl: process.env.SUPABASE_URL,
  supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,

} as const;

export default config;
