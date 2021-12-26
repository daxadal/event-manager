import { Document, Schema } from "mongoose";

export interface UserType {
  name: string;
  email: string;
  hashedPassword: string;
  sessionToken?: string;
  socketId?: string;
}

export type UserDocument = UserType & Document;

export const userSchema = new Schema<UserType>({
  name: String,
  email: String,
  hashedPassword: String,
  sessionToken: String,
  socketId: String,
});

userSchema.index({ email: 1 });
userSchema.index({ sessionToken: 1 });
