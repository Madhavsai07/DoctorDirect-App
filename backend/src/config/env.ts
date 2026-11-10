import dotenv from 'dotenv';

// Load .env before any other module reads process.env
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
const databaseSslSetting = process.env.DATABASE_SSL;
const webrtcStunUrls = (process.env.WEBRTC_STUN_URLS ?? '').split(',').map(value => value.trim()).filter(Boolean);
const webrtcTurnUrls = (process.env.WEBRTC_TURN_URLS ?? '').split(',').map(value => value.trim()).filter(Boolean);
const webrtcTurnSharedSecret = process.env.WEBRTC_TURN_SHARED_SECRET;
const webrtcTurnCredentialTtlSeconds = Number(process.env.WEBRTC_TURN_CREDENTIAL_TTL_SECONDS ?? '3600');
const corsOrigins = (
  process.env.CORS_ORIGINS ??
  (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5173')
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (databaseSslSetting && !['true', 'false'].includes(databaseSslSetting)) {
  throw new Error('DATABASE_SSL must be set to "true" or "false".');
}

if (process.env.NODE_ENV === 'production' && !databaseUrl) {
  throw new Error('DATABASE_URL is required in production.');
}

const containsInlineCredentials = (url: string) => /(?:^|[?&])(?:username|credential|password)=/i.test(url);

if (webrtcStunUrls.some(url => !/^(stun|stuns):[^,\s@]+$/i.test(url) || containsInlineCredentials(url))) {
  throw new Error('WEBRTC_STUN_URLS must contain only STUN or STUNS URLs without embedded credentials.');
}

if (webrtcTurnUrls.some(url => !/^(turn|turns):[^,\s@]+$/i.test(url) || containsInlineCredentials(url))) {
  throw new Error('WEBRTC_TURN_URLS must contain only TURN or TURNS URLs without embedded credentials.');
}

if (webrtcTurnUrls.length && (!webrtcTurnSharedSecret || webrtcTurnSharedSecret.length < 32)) {
  throw new Error('WEBRTC_TURN_SHARED_SECRET must be at least 32 characters when TURN URLs are configured.');
}

if (!Number.isInteger(webrtcTurnCredentialTtlSeconds) || webrtcTurnCredentialTtlSeconds < 60 || webrtcTurnCredentialTtlSeconds > 86400) {
  throw new Error('WEBRTC_TURN_CREDENTIAL_TTL_SECONDS must be an integer between 60 and 86400.');
}

if (process.env.NODE_ENV === 'production' && (!webrtcStunUrls.length || !webrtcTurnUrls.length)) {
  throw new Error('Configure both WEBRTC_STUN_URLS and WEBRTC_TURN_URLS in production.');
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
  corsOrigins,

  // ── Added in the Database milestone ──────────────────────────────────────
  databaseUrl,
  databaseSslEnabled: databaseSslSetting === 'true',
  databaseSslCa: process.env.DATABASE_SSL_CA,
  // For hosts such as Render, where a local CA file cannot be mounted.
  databaseSslCaBase64: process.env.DATABASE_SSL_CA_BASE64,

  // ── Added in the Authentication milestone ────────────────────────────────
  supabaseUrl: process.env.SUPABASE_URL,
  supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,

  // WebRTC media is peer-to-peer; this server only relays ephemeral signaling.
  // Production deployments must terminate TLS before accepting WebSocket upgrades.
  signalingPath: process.env.SIGNALING_PATH ?? '/api/v1/signaling',
  notificationWsPath: process.env.NOTIFICATION_WS_PATH ?? '/api/v1/notifications/stream',
  trustProxy: process.env.TRUST_PROXY === 'true',
  webrtcStunUrls,
  webrtcTurnUrls,
  webrtcTurnSharedSecret,
  webrtcTurnCredentialTtlSeconds,

} as const;

export default config;
