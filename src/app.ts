import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import resultRoutes from "./routes/result.routes";
import verifyRoutes from "./routes/verify.routes";
import validationRoutes from "./routes/validation.routes";
import rateLimit from "express-rate-limit";
import leadRoutes from "./routes/lead.routes";

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
});



const app = express();

const frontendUrl = process.env.FRONTEND_URL;

app.use(cors({
  origin: `${frontendUrl}`,
  credentials: true
}));

app.use(express.json());
app.use(limiter);
app.use("/auth", authRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/verify", verifyRoutes);
app.use("/api", validationRoutes);
app.use("/api", leadRoutes);

export default app;