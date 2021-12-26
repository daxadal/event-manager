import express, { NextFunction, Request, Response } from "express";
import { Logger } from "winston";

import { api } from "@/config";

import eventsRouter from "@/routes/events";
import usersRouter from "@/routes/users";
import devRouter from "@/routes/dev";
import jobsRouter from "@/routes/jobs";

const app = express();

if (api.DEV) app.use("/dev", devRouter);
app.use("/events", eventsRouter);
app.use("/users", usersRouter);
app.use("/jobs", jobsRouter);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const logger: Logger | Console = (req as any).logger || console;
  logger.error(
    `Internal server error at ${req.method} ${req.originalUrl} captured at final handler`,
    err
  );

  if (res.headersSent) next(err);
  else if (err.type === "entity.too.large")
    res.status(413).send({ message: "Payload too large" });
  else res.status(500).send({ message: "Internal server error" });
});

app.use((req, res) => {
  const logger: Logger | Console = (req as any).logger || console;
  logger.error(
    `Error at ${req.method} ${req.originalUrl} - Endpoint not found`
  );
  res.status(404).send({ message: "Endpoint not found" });
});

export default app;
