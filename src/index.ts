import "module-alias/register";

import { api, bree as breeConfig, configDebug, socket } from "@/config";
import bree from "@/scheduler";
import socketServer from "@/socket";
import app from "@/app";
import * as DB from "@/services/db";
import { getLogger } from "@/services/winston";

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

DB.createConnection();

app.listen(api.PORT, () => {
  logger.info(`Server listening on port ${api.PORT}...`);
});

socketServer.listen(socket.PORT, () => {
  logger.info(`Socket listening on port ${socket.PORT}...`);
});

logger.info(`DEV API is ${api.DEV ? "active" : "NOT available"}`);
logger.info(`Bree job is ${breeConfig.START ? "active" : "NOT available"}`);

if (breeConfig.START) {
  bree.start();
}
