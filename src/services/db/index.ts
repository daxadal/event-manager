/* eslint-disable no-underscore-dangle */
import { RequestHandler } from "express";
import { model } from "mongoose";
import { Logger } from "winston";
import { EventType, eventSchema, EventDocument, EventState } from "./event";
import { SubscriptionType, subscriptionSchema } from "./subscription";
import { UserType, userSchema, UserDocument } from "./user";

export { EventType, EventDocument, EventState } from "./event";
export { SubscriptionType, SubscriptionDocument } from "./subscription";
export { UserType, UserDocument } from "./user";

export const format = (object: unknown) => {
  const formatted = JSON.parse(JSON.stringify(object));
  formatted.id = formatted._id;
  delete formatted._id;
  delete formatted.__v;
  return formatted;
};

export const Event = model<EventType>("Event", eventSchema);
export const Subscription = model<SubscriptionType>(
  "Subscription",
  subscriptionSchema
);
export const User = model<UserType>("User", userSchema);

function isEventVisible(event: EventDocument, user: UserDocument) {
  switch (event.state) {
    case EventState.PUBLIC:
      return true;
    case EventState.PRIVATE:
      return Boolean(user);
    case EventState.DRAFT:
      return Boolean(user) && user.id === String(event.creatorId);
    default:
      throw new Error("Event has an unexpected state");
  }
}

export const loadEvent: RequestHandler = async (req: any, res, next) => {
  const logger: Logger | Console = (req as any).logger || console;
  const { eventId } = req.params;
  try {
    req.event = await Event.findById(eventId).exec();

    if (req.event && isEventVisible(req.event, req.user)) {
      logger.info(`"${req.method} ${req.originalUrl}": Event found`);
      next();
    } else {
      logger.error(`"${req.method} ${req.originalUrl}": Event not found`);
      res.status(400).send({ message: "Event not found" });
    }
  } catch (error) {
    logger.error(
      `Internal server error at ${req.method} ${req.originalUrl}`,
      error
    );
    res.status(500).send({ message: "Internal server error" });
  }
};
