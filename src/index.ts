import 'module-alias/register';

import { api, bree as breeConfig, configDebug, socket } from '@/config';
import bree from '@/scheduler';
import socketServer from '@/socket';
import app from '@/app';
import * as DB from '@/services/db';

console.info('=== SERVER STARTUP ===');

if (configDebug.dotenv.error)
  console.warn(`Could NOT parse .env, Error:`, configDebug.dotenv.error);
else if (!configDebug.dotenv.parsed)
  console.info(`Parsing .env produced no result`);
else
  console.info(
    `.env parsed. ${
      Object.keys(configDebug.dotenv.parsed).length
    } variables found.`
  );

if (configDebug.parsingErrors.length > 0) {
  console.error(`@config initialization failed`, {
    errors: configDebug.parsingErrors,
  });
  console.info('Exiting on error...\n');
  process.exit(1);
}

DB.setup();

app.listen(api.PORT, () => {
  console.info(`Server listening on port ${api.PORT}...`);
});

socketServer.listen(socket.PORT, () => {
  console.info(`Socket listening on port ${socket.PORT}...`);
});

console.info('DEV API is', api.DEV ? 'active' : 'NOT available');
console.info('Bree job is', breeConfig.START ? 'active' : 'NOT available');

if (breeConfig.START) {
  bree.start();
}
