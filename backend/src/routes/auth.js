import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
const cookieName = "pennypilot_token";
const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
});

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body ?? {};
  if (typeof name !== "string" || !name.trim() || name.length > 100 ||
      typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || email.length > 254 ||
      typeof password !== "string" || password.length < 8 || password.length > 128) {
    return res.status(400).json({ success: false, message: "Enter a name, valid email and password (8–128 characters)" });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail }, select: { id: true } });
    if (existing) return res.status(409).json({ success: false, message: "An account with this email already exists" });

    const user = await prisma.user.create({
      data: { name: name.trim(), email: normalizedEmail, passwordHash: await bcrypt.hash(password, 12) },
      select: { id: true, name: true, email: true, createdAt: true },
    });
    return res.status(201).json({ success: true, message: "Account created successfully", user });
  } catch (error) {
    if (error.code === "P2002") return res.status(409).json({ success: false, message: "An account with this email already exists" });
    console.error("Register error:", error);
    return res.status(500).json({ success: false, message: "Unable to create account" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" });
  }
  try {
    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d", issuer: "pennypilot", algorithm: "HS256",
    });
    res.cookie(cookieName, token, { ...cookieOptions(), maxAge: 7 * 24 * 60 * 60 * 1000 });
    return res.json({ success: true, message: "Login successful", user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: "Unable to login" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId }, select: { id: true, name: true, email: true },
    });
    if (!user) return res.status(401).json({ success: false, message: "Account not found" });
    return res.json({ success: true, user });
  } catch (error) {
    console.error("Session error:", error);
    return res.status(500).json({ success: false, message: "Unable to check session" });
  }
});

router.post("/logout", (_req, res) => {
  res.clearCookie(cookieName, cookieOptions());
  return res.json({ success: true, message: "Logged out" });
});

export default router;
