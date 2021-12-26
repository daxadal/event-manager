import mongoose, { Document } from "mongoose";

export interface SubscriptionType {
  eventId: mongoose.Types.ObjectId;
  subscriberId: mongoose.Types.ObjectId;
  subscriptionDate: Date;
  comment?: string;
}

export type SubscriptionDocument = SubscriptionType & Document;

export const subscriptionSchema = new mongoose.Schema<SubscriptionType>({
  eventId: mongoose.Types.ObjectId,
  subscriberId: mongoose.Types.ObjectId,
  subscriptionDate: Date,
  comment: String,
});

subscriptionSchema.index({ subscriberId: 1 });
subscriptionSchema.index({ eventId: 1 });
