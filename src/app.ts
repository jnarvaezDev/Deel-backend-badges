import express from "express";
import cors from "cors";
import helmet from "helmet";
import resultRoutes from "./routes/result.routes";
import verifyRoutes from "./routes/verify.routes";
import validationRoutes from "./routes/validation.routes";
import rateLimit from "express-rate-limit";
import leadRoutes from "./routes/lead.routes";
import { env } from "./config/env";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
});



const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.allowedOrigins,
    credentials: true,
  })
);

app.use(express.json({ limit: "200kb" }));
app.use(limiter);
app.use("/api/results", sensitiveLimiter);
app.use("/api/leads", sensitiveLimiter);
app.use("/api/validate-responses", sensitiveLimiter);
app.use("/api/results", resultRoutes);
app.use("/api/verify", verifyRoutes);
app.use("/api", validationRoutes);
app.use("/api", leadRoutes);

export default app;
