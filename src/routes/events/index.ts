import { json, Router, urlencoded } from "express";
import rateLimit from "express-rate-limit";

import eventsRootRouter from "./root";
import eventsIdRouter from "./id";
import eventsSubscribeRouter from "./subscribe";

import { closeLogger, getLoggerMiddleware } from "@/services/winston";
import { delayAfterResponse } from "@/services/middlewares";

export const EVENT_SIZE = "1kb";
export const EVENT_RPM = 100;

const router = Router();

router.use(getLoggerMiddleware("routes/events"));
router.use(delayAfterResponse(closeLogger));

router.use(json({ limit: EVENT_SIZE }));
router.use(urlencoded({ extended: true }));
router.use(
  rateLimit({
    max: EVENT_RPM,
    windowMs: 60 * 1000, // 1 minute
    message: "Too many requests",
  })
);

router.use("/", eventsRootRouter, eventsIdRouter, eventsSubscribeRouter);

export default router;
