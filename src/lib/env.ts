import { z } from "zod";

const envSchema = z.object({
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required"),
  AUTH_GOOGLE_ID: z.string().min(1, "AUTH_GOOGLE_ID is required"),
  AUTH_GOOGLE_SECRET: z.string().min(1, "AUTH_GOOGLE_SECRET is required"),
  SHOPIFY_STORE_DOMAIN: z.string().min(1, "SHOPIFY_STORE_DOMAIN is required"),
  SHOPIFY_ADMIN_ACCESS_TOKEN: z
    .string()
    .min(1, "SHOPIFY_ADMIN_ACCESS_TOKEN is required"),
  SHOPIFY_API_VERSION: z.string().default("2026-01"),
  NEXTAUTH_URL: z.string().url().optional(),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const errorMessages = parsed.error.errors
      .map((e) => `  ${e.path.join(".")}: ${e.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${errorMessages}`);
  }
  return parsed.data;
}

// Lazily validated — runs on first access (first request), not at build time.
let _cached: Env | undefined;
export const env = new Proxy({} as Env, {
  get(_, key: string) {
    if (!_cached) {
      _cached = validateEnv();
    }
    return _cached[key as keyof Env];
  },
}) as Env;
