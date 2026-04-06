import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  ANALYZER_API_KEY: z.string().default(''),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(30),
  OPENAI_API_KEY: z.string().default(''),
  OPENAI_MODEL: z.string().default('gpt-4.1-mini'),
  OPENAI_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
  OPENAI_MAX_RETRIES: z.coerce.number().int().min(0).max(5).default(1)
});

export const env = envSchema.parse(process.env);
