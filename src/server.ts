import app from "./app";
import { env } from "./config/env";

const PORT = env.port;

const releaseCommit =
  process.env.RENDER_GIT_COMMIT ?? process.env.VERCEL_GIT_COMMIT_SHA ?? "unknown";
const shortCommit =
  releaseCommit === "unknown" ? "unknown" : releaseCommit.slice(0, 7);

app.listen(PORT, () => {
  console.log(
    `[release] commit=${shortCommit} env=${env.nodeEnv} port=${PORT} timestamp=${new Date().toISOString()}`
  );
});
