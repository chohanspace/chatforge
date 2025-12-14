// src/lib/mongodb.ts
import { MongoClient, Db } from 'mongodb';
import 'dotenv/config';

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'chatforgeai';

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// Check if we're in a build environment (like Vercel, Netlify, Cloudflare Pages)
const IS_BUILD = process.env.CI || process.env.VERCEL || process.env.CF_PAGES;

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
    // During the build process, env vars might not be available.
    // We create a failing promise that will be caught by getDb if called during build.
    clientPromise = Promise.reject(new Error('MONGODB_URI is not defined in the production environment.'));
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
            throw new Error(`Database operation '${String(prop)}' attempted during build without MONGODB_URI.`);
        }
    });
  }
  
  // At runtime (or if MONGODB_URI is present during build), connect properly.
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined at runtime.');
  }
  const mongoClient = await clientPromise;
  return mongoClient.db(DB_NAME);
}
