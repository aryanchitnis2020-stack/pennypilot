import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import authRouter from "./routes/auth.js";
import dataRouter from "./routes/data.js";

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("Set JWT_SECRET to a secure random value (at least 32 characters) in backend/.env");
}

const app = express();
app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(express.json({ limit: "400kb" }));
app.use(cookieParser());

// Same-origin requests are used in development (Vite proxy) and production.
// JSON + SameSite=Lax cookies + no permissive CORS protect cookie-based writes.
app.get("/api/health", (_req, res) => res.json({ success: true, status: "healthy" }));
app.use("/api/auth", authRouter);
app.use("/api/data", dataRouter);

app.use("/api", (_req, res) => res.status(404).json({ success: false, message: "API route not found" }));

// Serve the React build from the same origin when deployed as a single service.
const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(here, "../../dist");
app.use(express.static(dist));
app.get("/{*path}", (_req, res) => res.sendFile(path.join(dist, "index.html"), (error) => {
  if (error && !res.headersSent) res.status(404).json({ success: false, message: "Frontend not built. Use Vite on port 5173 in development." });
}));

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`PennyPilot backend running on http://localhost:${port}`));
