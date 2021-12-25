import { Router } from "express";
import { Logger } from "winston";

const router = Router();

import { sendReminders, pingAll } from "../socket";
import { getMinuteInterval } from "@/services/utils";
import bree from "../scheduler";
import * as DB from "@/services/db";

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
    const { start, end } = getMinuteInterval();

    const events = await DB.Event.find({
      startDate: { $gte: start, $lte: end },
    });
    sendReminders(events);
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
    const events = await DB.Event.find();
    sendReminders(events);
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
