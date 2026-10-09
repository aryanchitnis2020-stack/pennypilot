import express from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { validSnapshot } from "../validation.js";

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { appData: true, dataVersion: true },
    });
    if (!user) return res.status(401).json({ success: false, message: "Account not found" });
    return res.json({ success: true, data: user.appData, version: user.dataVersion });
  } catch (error) {
    console.error("Read data error:", error);
    return res.status(500).json({ success: false, message: "Unable to load your data" });
  }
});

router.put("/", async (req, res) => {
  const { data, version } = req.body ?? {};
  if (!validSnapshot(data) || !Number.isSafeInteger(version) || version < 0) {
    return res.status(400).json({ success: false, message: "Invalid financial data" });
  }

  try {
    const result = await prisma.user.updateMany({
      where: { id: req.userId, dataVersion: version },
      data: { appData: data, dataVersion: { increment: 1 } },
    });

    if (result.count === 0) {
      return res.status(409).json({
        success: false,
        message: "Your data was changed in another session. Export your local backup before reloading.",
      });
    }

    return res.json({ success: true, version: version + 1 });
  } catch (error) {
    console.error("Save data error:", error);
    return res.status(500).json({ success: false, message: "Unable to save your data" });
  }
});

export default router;
