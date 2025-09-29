// src/lib/mongodb.ts
import { MongoClient, Db } from 'mongodb';
import 'dotenv/config';

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'chatforgeai';

if (!MONGODB_URI && process.env.NODE_ENV !== 'production') {
  throw new Error('Please define the MONGODB_URI environment variable inside .env for local development');
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!MONGODB_URI) {
    // This handles the build process on Render where MONGODB_URI isn't available at build time.
    // It creates a dummy promise that won't be used, allowing the build to pass.
    // At runtime, the real environment variable will be present.
    clientPromise = new Promise(() => {});
} else if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  // @ts-ignore
  if (!global._mongoClientPromise) {
    client = new MongoClient(MONGODB_URI, {});
    // @ts-ignore
    global._mongoClientPromise = client.connect();
  }
  // @ts-ignore
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(MONGODB_URI, {});
  clientPromise = client.connect();
}

export async function getDb(): Promise<Db> {
  if (!MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined at runtime. Please set it in your hosting environment.");
  }
  const mongoClient = await clientPromise;
  return mongoClient.db(DB_NAME);
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export { clientPromise };
