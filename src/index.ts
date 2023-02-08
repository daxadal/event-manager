import "module-alias/register";

import { api, cron, configDebug, socket } from "@/config";
import socketServer from "@/socket";
import app from "@/app";
import { createConnection } from "@/services/db/setup";
import { getLogger } from "@/services/winston";
import { CronJob } from "cron";
import { remindEvents } from "./jobs/remind";

const logger = getLogger("server-startup");

logger.info("=== SERVER STARTUP ===");
logger.debug(`process.env.NODE_ENV: ${process.env.NODE_ENV}`, { configDebug });

if (configDebug.dotenv.error)
  logger.warn(`Could NOT parse .env, Error:`, configDebug.dotenv.error);
else if (!configDebug.dotenv.parsed)
  logger.info(`Parsing .env produced no result`);
else
  logger.info(
    `.env parsed. ${
      Object.keys(configDebug.dotenv.parsed).length
    } variables found.`
  );

if (configDebug.parsingErrors.length > 0) {
  logger.error(`@config initialization failed`, {
    errors: configDebug.parsingErrors,
  });
  logger.info("Exiting on error...\n");
  process.exit(1);
}

createConnection();

const port = process.env.PORT ? parseInt(process.env.PORT) : api.PORT;
app.listen(port, () => {
  logger.info(`Server listening on port ${port}...`);
});

socketServer.listen(socket.PORT, () => {
  logger.info(`Socket listening on port ${socket.PORT}...`);
});

logger.info(`Cron job is ${cron.START ? "active" : "NOT available"}`);

if (cron.START) {
  new CronJob("* * * * *", remindEvents, null, true);
}
