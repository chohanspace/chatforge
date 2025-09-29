// src/lib/mongodb.ts
import { MongoClient, Db } from 'mongodb';
import 'dotenv/config';

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'chatforgeai';

// This check is for local development only to provide a clear error message.
if (!MONGODB_URI && process.env.NODE_ENV === 'development') {
  throw new Error('Please define the MONGODB_URI environment variable inside .env for local development');
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  // @ts-ignore
  if (!global._mongoClientPromise) {
    if (!MONGODB_URI) {
        // @ts-ignore
        global._mongoClientPromise = Promise.reject(new Error('MONGODB_URI is not defined in .env for development.'));
    } else {
        client = new MongoClient(MONGODB_URI, {});
        // @ts-ignore
        global._mongoClientPromise = client.connect();
    }
  }
  // @ts-ignore
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  // The MONGODB_URI is expected to be set in the deployment environment.
  if (!MONGODB_URI) {
    // We don't throw an error here at the top level for production,
    // because this file can be loaded during the build process where env vars might not be available.
    // The getDb function will handle the runtime error.
    clientPromise = Promise.reject(new Error('MONGODB_URI is not defined in the production environment.'));
  } else {
    client = new MongoClient(MONGODB_URI, {});
    clientPromise = client.connect();
  }
}

export async function getDb(): Promise<Db> {
  // This is the critical runtime check.
  if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined at runtime. Please set it in your hosting environment.");
  }
  const mongoClient = await clientPromise;
  return mongoClient.db(DB_NAME);
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export { clientPromise };
