import { Router } from "express";
import rateLimit from "express-rate-limit";
import { Logger } from "winston";

import { getLoggerMiddleware } from "@/services/winston";
import { remindEvents } from "@/jobs/remind";

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

router.post("/remind", async (req: any, res) => {
  const logger: Logger | Console = (req as any).logger || console;
  try {
    await remindEvents();
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
