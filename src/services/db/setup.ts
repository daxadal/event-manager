import mongoose from "mongoose";
import { db as dbConfig } from "@/config";
import { getLogger } from "@/services/winston";

export function createConnection(): Promise<typeof mongoose> {
  const logger = getLogger("server-startup");

  logger.info(`Connecting to MongoDB...`);

  mongoose.connection.on("connected", function () {
    logger.info("Mongoose default connection open to " + dbConfig.URL);
  });

  mongoose.connection.on("error", function (err) {
    logger.error("Mongoose default connection error: " + err);
  });

  mongoose.connection.on("disconnected", function () {
    logger.info("Mongoose default connection disconnected");
  });

  process.on("SIGINT", function () {
    mongoose.connection.close(function () {
      logger.info(
        "Mongoose default connection disconnected through app termination"
      );
      process.exit(0);
    });
  });

  return mongoose.connect(dbConfig.URL, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
  });
}

export function closeConnection(): Promise<void> {
  return mongoose.connection.close();
}
