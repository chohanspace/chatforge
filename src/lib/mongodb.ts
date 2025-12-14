// src/lib/mongodb.ts
import { MongoClient, Db } from 'mongodb';
import 'dotenv/config';

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'chatforgeai';

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// A flag to check if we are in a build process on a platform like Vercel or Cloudflare.
// The presence of CI=true is a common indicator.
const IS_BUILD = process.env.CI === 'true';

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  // @ts-ignore
  if (!global._mongoClientPromise) {
    if (!MONGODB_URI) {
      throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
    }
    client = new MongoClient(MONGODB_URI, {});
    // @ts-ignore
    global._mongoClientPromise = client.connect();
  }
  // @ts-ignore
  clientPromise = global._mongoClientPromise;
} else {
  // In production or build environments.
  if (!MONGODB_URI) {
    // If the MONGODB_URI is missing, we'll handle this in getDb.
    // In build, we'll use a mock. At runtime, we'll throw.
    clientPromise = Promise.reject(new Error('MONGODB_URI is not defined in the environment.'));
  } else {
    client = new MongoClient(MONGODB_URI, {});
    clientPromise = client.connect();
  }
}

export async function getDb(): Promise<Db> {
  // If we are in any build process (CI=true or NODE_ENV is not development),
  // and the MONGODB_URI is not set, we return a mock/proxy.
  // This allows Next.js to analyze page data without a real DB connection.
  if (process.env.NODE_ENV === 'production' && !MONGODB_URI && (IS_BUILD || typeof window === 'undefined')) {
    console.warn("MONGODB_URI not found during build/prerender. Using a mock DB object. This is normal for build servers.");
    // Return a proxy that will throw an error only if its methods are actually called.
    return new Proxy({} as Db, {
        get(target, prop) {
            throw new Error(`Database operation '${String(prop)}' attempted during build without a MONGODB_URI.`);
        }
    });
  }

  // At runtime, if the URI is still missing, we must throw an error.
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in the runtime environment. Please set it in your hosting environment.');
  }

  try {
    const mongoClient = await clientPromise;
    return mongoClient.db(DB_NAME);
  } catch(e) {
     // If the initial promise was rejected (e.g., no MONGODB_URI in production),
     // this catch block will handle it and provide a clear runtime error.
     console.error("Failed to connect to MongoDB:", e);
     throw new Error("Could not connect to the database. Verify the MONGODB_URI is correct and the database is accessible.");
  }
}