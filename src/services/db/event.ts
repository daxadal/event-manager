import { Document, Schema, Types } from "mongoose";

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
  creatorId: Types.ObjectId;
}

export type EventDocument = EventType & Document;

export const eventSchema = new Schema<EventType>({
  headline: String,
  description: String,
  startDate: Date,
  location: { name: String, lat: Number, lon: Number },
  state: String,
  creatorId: Types.ObjectId,
});

eventSchema.index({ creatorId: 1, state: 1 });
eventSchema.index({ state: 1 });
eventSchema.index({ startDate: -1 });
