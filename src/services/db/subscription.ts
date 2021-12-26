import { Document, Schema, Types } from "mongoose";

export interface SubscriptionType {
  eventId: Types.ObjectId;
  subscriberId: Types.ObjectId;
  subscriptionDate: Date;
  comment?: string;
}

export type SubscriptionDocument = SubscriptionType & Document;

export const subscriptionSchema = new Schema<SubscriptionType>({
  eventId: Types.ObjectId,
  subscriberId: Types.ObjectId,
  subscriptionDate: Date,
  comment: String,
});

subscriptionSchema.index({ subscriberId: 1 });
subscriptionSchema.index({ eventId: 1 });
