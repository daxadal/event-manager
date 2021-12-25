import mongoose, { Document } from 'mongoose';

import { hash } from '@/services/auth';
import { Event, EventType, User, UserType } from '@/services/db';

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

export const createMockUser = (
  fieldsToOverride: Dynamic<Partial<UserType>> = {},
  i = 0
): Promise<UserType & Document> => {
  const staticFields = staticfy(fieldsToOverride, i);
  return new User({
    name: `John Doe ${i}`,
    email: `${i}@doe.com`,
    hashedPassword: hash('password'),

    ...staticFields,
  }).save();
};

export const createMockEvent = (
  fieldsToOverride: Dynamic<Partial<EventType>> = {},
  i = 0
): Promise<EventType & Document> => {
  const staticFields = staticfy(fieldsToOverride, i);
  return new Event({
    headline: `New event ${i}`,
    startDate: Date.now(),
    location: { name: 'Somewhere' },
    state: 'draft',

    ...staticFields,
  }).save();
};

export function createMockEvents(
  amount: number,
  fieldsToOverride: Dynamic<Partial<EventType>> = {}
): Promise<Array<EventType & Document>> {
  const eventPromises = new Array(amount)
    .fill(undefined)
    .map((_, i) => createMockEvent(fieldsToOverride, i));
  return Promise.all(eventPromises);
}
