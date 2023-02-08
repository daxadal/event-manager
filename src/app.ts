import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { Logger } from "winston";

import indexRouter from "@/routes/index";
import eventsRouter from "@/routes/events";
import usersRouter from "@/routes/users";
import docsRouter from "@/routes/docs";
import jobsRouter from "@/routes/jobs";
import { getLogger } from "@/services/winston";

const app = express();

app.use(cors());

app.use("/", indexRouter);
app.use("/docs", docsRouter);
app.use("/events", eventsRouter);
app.use("/users", usersRouter);
app.use("/jobs", jobsRouter);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const logger: Logger = (req as any).logger || getLogger("routes/_default_");
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
  const logger: Logger = (req as any).logger || getLogger("routes/_default_");
  logger.error(
    `Error at ${req.method} ${req.originalUrl} - Endpoint not found`
  );
  res.status(404).send({ message: "Endpoint not found" });
});

export default app;
