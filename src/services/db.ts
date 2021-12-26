/* eslint-disable no-underscore-dangle */
import mongoose, { Document } from "mongoose";

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

export enum EventState {
  DRAFT = "draft",
  PRIVATE = "private",
  PUBLIC = "public",
}

export interface EventType {
  headline: string;
  description?: string;
  startDate: Date;
  location?: { name?: String; lat?: number; lon?: number };
  state: EventState;
  creatorId: mongoose.Types.ObjectId;
}

export type EventDocument = EventType & Document;

const eventSchema = new mongoose.Schema<EventType>({
  headline: String,
  description: String,
  startDate: Date,
  location: { name: String, lat: Number, lon: Number },
  state: String,
  creatorId: mongoose.Types.ObjectId,
});

eventSchema.index({ creatorId: 1, state: 1 });
eventSchema.index({ state: 1 });
eventSchema.index({ startDate: -1 });

export interface UserType {
  name?: string;
  email?: string;
  hashedPassword?: string;
  sessionToken: string;
  socketId: string;
}

export type UserDocument = UserType & Document;

const userSchema = new mongoose.Schema<UserType>({
  name: String,
  email: String,
  hashedPassword: String,
  sessionToken: String,
  socketId: String,
});
userSchema.index({ email: 1 });
userSchema.index({ sessionToken: 1 });

export interface SubscriptionType {
  eventId: mongoose.Types.ObjectId;
  subscriberId: mongoose.Types.ObjectId;
  subscriptionDate: Date;
  comment?: string;
}

export type SubscriptionDocument = SubscriptionType & Document;

const subscriptionSchema = new mongoose.Schema<SubscriptionType>({
  eventId: mongoose.Types.ObjectId,
  subscriberId: mongoose.Types.ObjectId,
  subscriptionDate: Date,
  comment: String,
});
subscriptionSchema.index({ subscriberId: 1 });
subscriptionSchema.index({ eventId: 1 });

export const format = (object: unknown) => {
  const formatted = JSON.parse(JSON.stringify(object));
  formatted.id = formatted._id;
  delete formatted._id;
  delete formatted.__v;
  return formatted;
};

export const Event = mongoose.model<EventType>("Event", eventSchema);
export const Subscription = mongoose.model<SubscriptionType>(
  "Subscription",
  subscriptionSchema
);
export const User = mongoose.model<UserType>("User", userSchema);
