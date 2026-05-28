import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { env } from "./env.js";

let memoryServer: MongoMemoryServer | null = null;

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (env.DEV_USE_INMEMORY_DB || process.env.VITEST === "true") {
    memoryServer ??= await MongoMemoryServer.create({
      instance: {
        dbName: "goalflow"
      }
    });

    const memoryUri = memoryServer.getUri();
    await mongoose.connect(memoryUri);
    console.warn(`Using in-memory MongoDB at ${memoryUri}`);
    return mongoose.connection;
  }

  try {
    await mongoose.connect(env.MONGODB_URI);
  } catch (error) {
    if (!env.DEV_USE_INMEMORY_DB) {
      throw error;
    }

    memoryServer ??= await MongoMemoryServer.create({
      instance: {
        dbName: "goalflow"
      }
    });

    const memoryUri = memoryServer.getUri();
    await mongoose.connect(memoryUri);
    console.warn(`Falling back to in-memory MongoDB at ${memoryUri}`);
  }

  return mongoose.connection;
}
