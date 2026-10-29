import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { Logger } from "winston";

import { delayAfterResponse } from "./services/middlewares";

import docsRouter from "@/routes/docs";
import eventsRouter from "@/routes/events";
import indexRouter from "@/routes/index";
import jobsRouter from "@/routes/jobs";
import usersRouter from "@/routes/users";
import {
  closeLogger,
  getLogger,
  getLoggerMiddleware,
} from "@/services/winston";

const app = express();

app.use(cors());
app.use(getLoggerMiddleware());
app.use(delayAfterResponse(closeLogger));

app.use("/", indexRouter);
app.use("/docs", docsRouter);
app.use("/events", eventsRouter);
app.use("/users", usersRouter);
app.use("/jobs", jobsRouter);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const logger: Logger = (req as any).logger || getLogger();
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
  const logger: Logger = (req as any).logger || getLogger();
  logger.error(
    `Error at ${req.method} ${req.originalUrl} - Endpoint not found`
  );
  res.status(404).send({ message: "Endpoint not found" });
});

export default app;
