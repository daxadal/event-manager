import path from "path";
import TransportStream from "winston-transport";
import SlackHook from "winston-slack-webhook-transport";
import { transports } from "winston";

import { winston as config } from "@/config";
import { fileAndConsoleFormatter, slackFormatter } from "./formatters";

export const getSlackTransport = (
  level: string,
  service: string,
  webhookUrl: string,
  filterPriorityOut = false
): TransportStream =>
  new SlackHook({
    webhookUrl,
    level,
    formatter: info => slackFormatter(service, filterPriorityOut, info),
  });

export const getConsoleTransport = (
  level: string,
  silent = false
): TransportStream =>
  new transports.Console({ level, silent, format: fileAndConsoleFormatter });

export const getFileTransport = (
  level: string,
  service: string,
  dateForFileName: string,
  fileTag: string
): TransportStream =>
  new transports.File({
    level,
    format: fileAndConsoleFormatter,
    filename: path.join(
      __dirname,
      "../../../logs",
      config.file.prefix || "",
      service,
      `${dateForFileName}-${fileTag}.log`
    ),
    maxsize: 52428800,
  });
