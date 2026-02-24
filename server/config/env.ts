import 'dotenv/config';
import { z } from 'zod';

// Simple console logger for early-stage errors before full logger is available
const earlyLogger = {
  info: (...args: unknown[]) => console.log('[INFO]', ...args),
  error: (...args: unknown[]) => console.error('[ERROR]', ...args),
};

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url().min(1),
  
  // Session Security
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  
  // External Services (optional but validated if present)
  STRIPE_SECRET_KEY: z.string().startsWith('sk_').optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_').optional(),
  ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-').optional(),
  OPENAI_API_KEY: z.string().startsWith('sk-').optional(),
  OPENMETER_API_KEY: z.string().optional(),
  
  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().regex(/^\d+$/).default('3001'),
  
  // Admin Configuration
  ADMIN_EMAIL: z.string().email().optional(),
  
  // Replit (if using OIDC)
  REPL_ID: z.string().optional(),
  REPLIT_DEV_DOMAIN: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(): EnvConfig {
  try {
    const env = envSchema.parse(process.env);
    earlyLogger.info('Environment validation passed');
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(i => `${i.path.join('.')}: ${i.message}`);
      earlyLogger.error('Environment validation failed:', issues);
      throw new Error(`Invalid environment configuration:\n${issues.join('\n')}`);
    }
    throw error;
  }
}

export const env = validateEnv();
