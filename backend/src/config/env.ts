import dotenv from 'dotenv';

// Load .env before any other module reads process.env
dotenv.config();

/**
 * Centralized environment configuration.
 *
 * All environment variables are read here so that the rest of the
 * application never accesses process.env directly. This makes it easy
 * to add validation, defaults, or type coercion in one place.
 *
 * Values like DATABASE_URL, JWT_SECRET, and GROQ_API_KEY are declared
 * here so future milestones can simply extend this object.
 */
const config = {
  port: parseInt(process.env.PORT ?? '5001', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',

  // ── Added in the Database milestone ──────────────────────────────────────
  databaseUrl: process.env.DATABASE_URL,

  // ── Added in the Authentication milestone ────────────────────────────────
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',

  // ── Added in the AI Consultation milestone ────────────────────────────────
  groqApiKey: process.env.GROQ_API_KEY,
} as const;

export default config;
