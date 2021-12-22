import mongoose from 'mongoose';

export async function clearDatabase(): Promise<void> {
  const collections = mongoose.connection.collections;
  const promises = Object.values(collections).map((collection) =>
    collection.deleteMany({})
  );
  await Promise.all(promises);
}
