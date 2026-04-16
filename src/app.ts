import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import resultRoutes from "./routes/result.routes";
import verifyRoutes from "./routes/verify.routes";

const app = express();

const frontendUrl = process.env.FRONTEND_URL;

app.use(cors({
  origin: `${frontendUrl}`,
  credentials: true
}));

app.use(express.json());

app.use("/auth", authRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/verify", verifyRoutes);

export default app;