import express from "express";
import cors from "cors";
import "dotenv/config";
import authRouter from "./routes/auth.js";

const app = express();

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "PennyPilot API is running",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
  });
});

app.use("/api/auth", authRouter);

app.listen(PORT, () => {
  console.log(`PennyPilot backend running on http://localhost:${PORT}`);
});