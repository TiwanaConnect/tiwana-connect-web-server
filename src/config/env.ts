import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  APP_URL: z.string().url(),
  MOBILE_API_BASE_URL: z.string().url(),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development")
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  APP_URL: process.env.APP_URL,
  MOBILE_API_BASE_URL: process.env.MOBILE_API_BASE_URL,
  NODE_ENV: process.env.NODE_ENV
});
