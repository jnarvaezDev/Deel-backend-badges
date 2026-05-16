import dotenv from "dotenv";

dotenv.config();

type NodeEnv = "development" | "test" | "production";

const requiredEnvVars = [
  "DATABASE_URL",
  "OPENAI_API_KEY",
  "VIRTUALBADGE_API_KEY",
  "VIRTUALBADGE_API_BASE_URL",
  "VIRTUALBADGE_CREATE_RECIPIENT_ENDPOINT",
  "VIRTUALBADGE_TEMPLATE_GLOBAL_TALENT",
  "VIRTUALBADGE_TEMPLATE_GLOBAL_LEADER",
  "VIRTUALBADGE_TEMPLATE_GLOBAL_CHAMPION",
] as const;

const parseBoolean = (value: string | undefined): boolean => {
  return value?.toLowerCase() === "true";
};

const parseNodeEnv = (value: string | undefined): NodeEnv => {
  if (value === "production" || value === "test") {
    return value;
  }

  return "development";
};

const parseOrigins = (value: string | undefined): string[] => {
  if (!value) return [];
  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const validateRequiredEnv = (): void => {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `❌ Missing required environment variables: ${missing.join(", ")}. Check .env.example and configure your .env before starting the backend.`
    );
  }
};

const nodeEnv = parseNodeEnv(process.env.NODE_ENV);
const frontendUrl = process.env.FRONTEND_URL;
const corsAllowedOrigins = parseOrigins(process.env.CORS_ALLOWED_ORIGINS);

if (nodeEnv === "production") {
  if (corsAllowedOrigins.length === 0) {
    throw new Error(
      "❌ CORS_ALLOWED_ORIGINS is required in production and must contain explicit origins (comma-separated)."
    );
  }

  if (corsAllowedOrigins.includes("*")) {
    throw new Error(
      "❌ Wildcard '*' is not allowed for CORS_ALLOWED_ORIGINS in production."
    );
  }
}

validateRequiredEnv();

const allowedOrigins =
  corsAllowedOrigins.length > 0
    ? corsAllowedOrigins
    : frontendUrl
    ? [frontendUrl]
    : [];

if (allowedOrigins.length === 0) {
  throw new Error(
    "❌ No allowed CORS origins configured. Set CORS_ALLOWED_ORIGINS or FRONTEND_URL."
  );
}

export const env = {
  nodeEnv,
  port: Number(process.env.PORT ?? 3000),
  frontendUrl,
  allowedOrigins,
  databaseUrl: process.env.DATABASE_URL as string,
  dbSslInsecure: parseBoolean(process.env.DB_SSL_INSECURE),
  dbSslCa: process.env.DB_SSL_CA,
};
