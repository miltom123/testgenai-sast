import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

/**
 * Esquema de validación estricta de variables de entorno para TestGenAI MVP.
 * El servidor no arranca si falta alguna variable crítica o es insegura.
 */
const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),

    // PostgreSQL es el único motor soportado para el MVP consolidado
    DATABASE_URL: z
      .string()
      .min(1, 'DATABASE_URL es obligatoria')
      .refine(
        (url) => url.startsWith('postgresql://') || url.startsWith('postgres://'),
        'DATABASE_URL debe ser una URL de conexión a PostgreSQL (postgresql://...)'
      ),

    JWT_SECRET: z.string().min(16, 'JWT_SECRET debe tener al menos 16 caracteres'),
    JWT_REFRESH_SECRET: z.string().optional(),
    ACCESS_TOKEN_EXPIRES_IN: z.string().default('1h'),
    REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),

    BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
    CORS_ORIGINS: z.string().default('*'),

    // Solo proveedores reales: gemini u openai
    AI_PROVIDER_DEFAULT: z.enum(['gemini', 'openai']).default('gemini'),
    GEMINI_API_KEY: z.string().optional().default(''),
    OPENAI_API_KEY: z.string().optional().default(''),

    AI_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
    AI_MAX_RETRIES: z.coerce.number().int().min(0).max(3).default(1),
    AI_PROJECT_BUDGET_USD: z.coerce.number().min(0).default(10),

    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
  })
  .superRefine((val, ctx) => {
    if (val.NODE_ENV === 'production') {
      if (val.JWT_SECRET.length < 32 || val.JWT_SECRET.includes('cambie_esto')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['JWT_SECRET'],
          message: 'En producción JWT_SECRET debe tener >= 32 caracteres seguros.',
        });
      }
      if (val.CORS_ORIGINS.trim() === '*') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['CORS_ORIGINS'],
          message: 'En producción CORS_ORIGINS no puede ser "*"; defina una lista explícita.',
        });
      }
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.errors
    .map((e) => `  - ${e.path.join('.') || '(raíz)'}: ${e.message}`)
    .join('\n');
  console.error('❌ Configuración de entorno inválida:\n' + details);
  process.exit(1);
}

export const env = parsed.data;
export const JWT_REFRESH_SECRET = env.JWT_REFRESH_SECRET || `${env.JWT_SECRET}_refresh`;
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

export function getCorsOrigins(): string[] | '*' {
  const raw = env.CORS_ORIGINS.trim();
  if (raw === '*') return '*';
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}
