
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
    // If the MONGODB_URI is missing and we're in a build process, we'll handle this in getDb.
    // If it's missing at runtime, getDb will throw an error.
    clientPromise = Promise.reject(new Error('MONGODB_URI is not defined in the environment.'));
  } else {
    client = new MongoClient(MONGODB_URI, {});
    clientPromise = client.connect();
  }
}

export async function getDb(): Promise<Db> {
  // If we are in a build process and the MONGODB_URI is not set,
  // we return a mock/proxy that will throw an error only if actually used.
  // This allows Next.js to analyze page data without a real DB connection.
  if (IS_BUILD && !MONGODB_URI) {
    console.warn("MONGODB_URI not found during build. Using a mock DB object. This is normal for build servers.");
    // Return a proxy that will throw an error if any of its methods are called.
    return new Proxy({} as Db, {
        get(target, prop) {
            // This error will only be thrown if the code *uses* a db method during build.
            // Static analysis or tree-shaking should ideally prevent this.
            throw new Error(`Database operation '${String(prop)}' attempted during build without MONGODB_URI.`);
        }
    });
  }

  // At runtime (or if MONGODB_URI is present during build), connect properly.
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined at runtime. Please set it in your hosting environment.');
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
