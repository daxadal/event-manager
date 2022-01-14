import { Router } from "express";
import { Logger } from "winston";

import { pingAll } from "../socket";
import bree from "../scheduler";
import { getLoggerMiddleware } from "@/services/winston";
import { remindEvents, remindAllEvents } from "../jobs/remind";

const router = Router();

router.use(getLoggerMiddleware("routes/dev"));

router.post("/ping", async (req, res) => {
  const logger: Logger | Console = (req as any).logger || console;
  try {
    await pingAll();
    res.status(200).send({ message: "All sockets pinged" });
  } catch (error) {
    logger.error(
      `Internal server error at ${req.method} ${req.originalUrl}`,
      error
    );
    res.status(500).send({ message: "Internal server error" });
  }
});

router.post("/remind", async (req, res) => {
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

router.post("/remind-bree", async (req, res) => {
  bree.run("remind");
  res.status(200).send({ message: "Reminders sent" });
});

router.post("/remind-all-bree", async (req, res) => {
  bree.run("remind-all");
  res.status(200).send({ message: "Reminders sent" });
});

router.post("/remind-all", async (req, res) => {
  const logger: Logger | Console = (req as any).logger || console;
  try {
    await remindAllEvents();
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
