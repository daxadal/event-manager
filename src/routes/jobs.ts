import { Router } from "express";
import rateLimit from "express-rate-limit";
import { Logger } from "winston";

import { sendReminders } from "@/socket";
import { Event } from "@/services/db";
import { checkBreeToken } from "@/services/auth";
import { getLoggerMiddleware } from "@/services/winston";

export const MAIN_RPM = 10;

const router = Router();

router.use(getLoggerMiddleware("routes/jobs"));

router.use(
  rateLimit({
    max: MAIN_RPM,
    windowMs: 60 * 1000,
    message: "Too many requests",
  })
);

router.post("/remind", checkBreeToken, async (req: any, res) => {
  const logger: Logger | Console = (req as any).logger || console;
  try {
    logger.info("Remind:", req.dates);
    const { start, end } = req.dates;

    const events = await Event.find({
      startDate: { $gte: start, $lte: end },
    });
    await sendReminders(events);
    res.status(200).send({ message: "Reminders sent" });
  } catch (error) {
    logger.error(
      `Internal server error at ${req.method} ${req.originalUrl}`,
      error
    );
    res.status(500).send({ message: "Internal server error" });
  }
});

export default router;
