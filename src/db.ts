import { Pool } from "pg";
import { env } from "./config/env";

const useInsecureSsl = env.nodeEnv !== "production" && env.dbSslInsecure;
const sslCa = env.dbSslCa?.replace(/\\n/g, "\n");

if (env.nodeEnv === "production" && env.dbSslInsecure) {
  throw new Error(
    "❌ DB_SSL_INSECURE=true is not allowed in production. Remove it to enforce secure TLS."
  );
}

const sslConfig = useInsecureSsl
  ? {
      rejectUnauthorized: false,
    }
  : {
      rejectUnauthorized: true,
      ...(sslCa ? { ca: sslCa } : {}),
    };

const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: sslConfig,
});

export default pool;
