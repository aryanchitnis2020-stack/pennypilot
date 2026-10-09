import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const token = req.cookies?.pennypilot_token;

  if (!token || !process.env.JWT_SECRET) {
    return res.status(401).json({ success: false, message: "Please sign in" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: "pennypilot",
      algorithms: ["HS256"],
    });

    if (typeof payload.sub !== "string" || !payload.sub) {
      return res.status(401).json({ success: false, message: "Invalid session" });
    }

    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Session expired. Please sign in again" });
  }
}
