import "module-alias/register";

import { api, bree as breeConfig, configDebug, socket } from "@/config";
import socketServer from "@/socket";
import app from "@/app";
import { createConnection } from "@/services/db/setup";
import { getLogger } from "@/services/winston";
import { CronJob } from "cron";
import { remindEvents } from "./jobs/remind";

const logger = getLogger("server-startup");

logger.info("=== SERVER STARTUP ===");

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

app.listen(api.PORT, () => {
  logger.info(`Server listening on port ${api.PORT}...`);
});

socketServer.listen(socket.PORT, () => {
  logger.info(`Socket listening on port ${socket.PORT}...`);
});

logger.info(`Bree job is ${breeConfig.START ? "active" : "NOT available"}`);

if (breeConfig.START) {
  new CronJob("* * * * *", remindEvents, null, true);
}
