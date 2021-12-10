import TransportStream from "winston-transport";
import { createLogger, format, Logger } from "winston";
import { RequestHandler } from "express";

import { winston as config, LogLevel } from "@/config";
import { extractAxios } from "@/services/winston/formatters";
import {
  getSlackTransport,
  getFileTransport,
  getConsoleTransport,
} from "@/services/winston/transports";

function getWinstonLevel(rawlevel: LogLevel): string {
  switch (rawlevel) {
    case LogLevel.VERBOSE:
      return "silly";
    case LogLevel.INFO:
      return "info";
    case LogLevel.WARN:
      return "warn";
    case LogLevel.ERROR:
    default:
      return "error";
  }
}

function getTransportsPerConfig(service: string) {
  const dateForFileName = new Date().toISOString().split("T")[0];

  const transports: TransportStream[] = [];

  if (config.slack.level >= LogLevel.ERROR) {
    if (config.slack.webhooks.priority)
      transports.push(
        getSlackTransport("error", service, config.slack.webhooks.priority)
      );
    if (config.slack.webhooks.all) {
      const filterPriorityOut = Boolean(config.slack.webhooks.priority);
      const level = getWinstonLevel(config.slack.level);
      transports.push(
        getSlackTransport(level, service, config.slack.webhooks.all, filterPriorityOut)
      );
    }
  }

  if (config.file.level >= LogLevel.ERROR) {
    const level = config.file.level >= LogLevel.WARN ? "warn" : "error";
    transports.push(
      getFileTransport(level, service, dateForFileName, "errors")
    );
  }
  if (config.file.level >= LogLevel.INFO)
    transports.push(getFileTransport("info", service, dateForFileName, "all"));
  if (config.file.level >= LogLevel.VERBOSE)
    transports.push(
      getFileTransport("silly", service, dateForFileName, "verbose")
    );

  if (config.console.level >= LogLevel.ERROR) {
    const level = getWinstonLevel(config.console.level);
    transports.push(getConsoleTransport(level));
  }

  if (transports.length === 0)
    transports.push(getConsoleTransport("error", true));

  return transports;
}

export function getLogger(service = "api"): Logger {
  const transports = getTransportsPerConfig(service);

  return createLogger({
    format: format.combine(
      format.metadata({
        key: "meta",
        fillExcept: ["level", "message", "stack", "timestamp"],
      }),
      format.timestamp(),
      format.errors({ stack: true }),
      extractAxios()
    ),
    transports,
  });
}

export const initLogger =
  (service= "api"): RequestHandler =>
  (req: any, res, next) => {
    req.logger = getLogger(service);
    req.logger.info(
      `==== Starting execution of endpoint ${req.originalUrl} ====`
    );
    next();
  };
