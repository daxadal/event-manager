/* eslint-disable no-underscore-dangle */
import { model } from "mongoose";
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

export const Event = model<EventType>("Event", eventSchema);
export const Subscription = model<SubscriptionType>(
  "Subscription",
  subscriptionSchema
);
export const User = model<UserType>("User", userSchema);
