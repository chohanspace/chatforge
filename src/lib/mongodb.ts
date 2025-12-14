// src/lib/mongodb.ts
import { MongoClient, Db } from 'mongodb';
import 'dotenv/config';

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'chatforgeai';

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// A flag to check if we are in a build process on a platform like Vercel or Cloudflare.
// The presence of CI=true is a common indicator.
const IS_BUILD = process.env.CI === 'true' || process.env.NODE_ENV === 'production';

if (!MONGODB_URI) {
  // If the MONGODB_URI is missing, we need to handle it differently for build vs. runtime.
  if (IS_BUILD) {
    // In a build environment (like `next build` on Vercel/Cloudflare), we don't have secrets.
    // We create a placeholder promise that will never resolve. This allows the build to
    // inspect code without crashing. The getDb function will handle this case.
    console.warn("MONGODB_URI not found during build. Using a mock DB object. This is normal for build servers.");
    clientPromise = new Promise(() => {}); // A promise that never resolves
  } else {
    // In a local development or runtime environment, the URI is required.
    throw new Error('Please define the MONGODB_URI environment variable inside .env or your hosting environment.');
  }
} else {
  // If the URI is present, proceed as normal.
  if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable to preserve the client across HMR.
    // @ts-ignore
    if (!global._mongoClientPromise) {
      client = new MongoClient(MONGODB_URI, {});
      // @ts-ignore
      global._mongoClientPromise = client.connect();
    }
    // @ts-ignore
    clientPromise = global._mongoClientPromise;
  } else {
    // In production, create a new client.
    client = new MongoClient(MONGODB_URI, {});
    clientPromise = client.connect();
  }
}

export async function getDb(): Promise<Db> {
  // If we are in any build process and the MONGODB_URI is not set, we return a mock/proxy.
  // This allows Next.js to analyze page data without a real DB connection.
  if (IS_BUILD && !MONGODB_URI) {
    // Return a proxy that will throw an error only if its methods are actually called.
    // This should not happen during a static build (`next build`) but is a safeguard.
    return new Proxy({} as Db, {
        get(target, prop) {
            // This error will only be thrown if server-side code *during the build*
            // tries to perform a database operation (e.g., in getServerSideProps).
            // For static pages, this part of the code is not reached.
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
     // If the initial promise was rejected (e.g., bad connection string), this will catch it.
     console.error("Failed to connect to MongoDB:", e);
     throw new Error("Could not connect to the database. Verify the MONGODB_URI is correct and the database is accessible.");
  }
}
