/* eslint-disable no-underscore-dangle */
import mongoose from "mongoose";
import { EventType, eventSchema } from "./event";
import { SubscriptionType, subscriptionSchema } from "./subscription";
import { UserType, userSchema } from "./user";

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

export const Event = mongoose.model<EventType>("Event", eventSchema);
export const Subscription = mongoose.model<SubscriptionType>(
  "Subscription",
  subscriptionSchema
);
export const User = mongoose.model<UserType>("User", userSchema);
