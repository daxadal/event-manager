import { hash } from "bcryptjs";
import mongoose from "mongoose";

import {
  Event,
  EventDocument,
  EventState,
  EventType,
  User,
  UserDocument,
  UserType,
} from "@/services/db";
import { HASH_ROUNDS } from "@/routes/users";

export async function clearDatabase(): Promise<void> {
  const collections = mongoose.connection.collections;
  const promises = Object.values(collections).map((collection) =>
    collection.deleteMany({})
  );
  await Promise.all(promises);
}

export type Dynamic<Type> = {
  [Property in keyof Type]: Type[Property] | ((i: number) => Type[Property]);
};

const staticfy = <T extends Record<string, unknown>>(
  obj: Dynamic<T>,
  i: number
): T =>
  Object.keys(obj).reduce<any>((result, key) => {
    const value = obj[key];

    result[key] = value instanceof Function ? value(i) : value;
    return result;
  }, {});

export const createMockUser = async (
  fieldsToOverride: Dynamic<Partial<UserType>> = {},
  i = 0
): Promise<UserDocument> => {
  const staticFields = staticfy(fieldsToOverride, i);
  return new User({
    name: `John Doe ${i}`,
    email: `${i}@doe.com`,
    hashedPassword: await hash("password", HASH_ROUNDS),

    ...staticFields,
  }).save();
};

export async function createMockUsers(
  amount: number,
  fieldsToOverride: Dynamic<Partial<UserType>> = {}
): Promise<UserDocument[]> {
  const promises = new Array(amount)
    .fill(undefined)
    .map((_, i) => createMockUser(fieldsToOverride, i));
  return Promise.all(promises);
}

export const createMockEvent = (
  fieldsToOverride: Dynamic<Partial<EventType>> = {},
  i = 0
): Promise<EventDocument> => {
  const staticFields = staticfy(fieldsToOverride, i);
  return new Event({
    headline: `New event ${i}`,
    startDate: Date.now(),
    location: { name: "Somewhere" },
    state: EventState.DRAFT,

    ...staticFields,
  }).save();
};

export function createMockEvents(
  amount: number,
  fieldsToOverride: Dynamic<Partial<EventType>> = {}
): Promise<Array<EventDocument>> {
  const eventPromises = new Array(amount)
    .fill(undefined)
    .map((_, i) => createMockEvent(fieldsToOverride, i));
  return Promise.all(eventPromises);
}
