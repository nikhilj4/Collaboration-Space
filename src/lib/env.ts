import { z } from 'zod';

/**
 * Centralized environment variable parsing.
 *
 * Goals:
 * - Fail fast with clear errors in production/server environments
 * - Avoid sprinkling `process.env.X!` across the codebase
 * - Keep "public" client env separate from server-only secrets
 */

const nonEmpty = z.string().min(1);

const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Firebase Admin (server-only)
  FIREBASE_PROJECT_ID: nonEmpty,
  FIREBASE_CLIENT_EMAIL: nonEmpty.email(),
  FIREBASE_PRIVATE_KEY: nonEmpty,

  // Shared (used by Admin SDK init)
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: nonEmpty,

  // Upstash rate limiting (optional, but recommended in production)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: nonEmpty.optional(),

  // Payments (server-only)
  RAZORPAY_KEY_ID: nonEmpty.optional(),
  RAZORPAY_KEY_SECRET: nonEmpty.optional(),
});

const publicSchema = z.object({
  NEXT_PUBLIC_FIREBASE_API_KEY: nonEmpty,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: nonEmpty,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: nonEmpty,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: nonEmpty,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: nonEmpty,
  NEXT_PUBLIC_FIREBASE_APP_ID: nonEmpty,
});

export type ServerEnv = z.infer<typeof serverSchema>;
export type PublicEnv = z.infer<typeof publicSchema>;

function formatZodError(err: z.ZodError) {
  return err.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ');
}

let _serverEnv: ServerEnv | null = null;
export function env(): ServerEnv {
  if (_serverEnv) return _serverEnv;
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid server environment variables: ${formatZodError(parsed.error)}`);
  }

  // Normalize multiline private key (common in Vercel/CI env vars)
  _serverEnv = {
    ...parsed.data,
    FIREBASE_PRIVATE_KEY: parsed.data.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  };
  return _serverEnv;
}

let _publicEnv: PublicEnv | null = null;
export function publicEnv(): PublicEnv {
  if (_publicEnv) return _publicEnv;
  const parsed = publicSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid public environment variables: ${formatZodError(parsed.error)}`);
  }
  _publicEnv = parsed.data;
  return _publicEnv;
}

