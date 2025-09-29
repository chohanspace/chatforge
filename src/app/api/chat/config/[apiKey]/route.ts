// src/app/api/chat/config/[apiKey]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

// This new route provides the public configuration for a given chatbot.
export async function GET(req: NextRequest, { params }: { params: { apiKey: string }}) {
    const apiKey = params.apiKey;

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required.' }, { status: 401 });
    }
  
    try {
      const db = await getDb();
      // Find the chatbot by its unique API key
      const chatbot = await db.collection('chatbots').findOne({ apiKey });
  
      if (!chatbot) {
          return NextResponse.json({ error: 'Invalid API key.' }, { status: 401 });
      }

      // Check if the owner is banned or get their plan
      const user = await db.collection('users').findOne({ _id: chatbot.userId });
      if (user?.isBanned) {
        return NextResponse.json({ error: 'This chatbot has been disabled.' }, { status: 403 });
      }

      // Return public-safe configuration from the chatbot document
      const response = NextResponse.json({
        name: chatbot.name || 'Chat with us',
        welcome: chatbot.welcomeMessage || 'Hello! How can I help you today?',
        color: chatbot.color || '#007BFF',
        plan: user?.plan || 'Free', // Send the plan name
      });
      
      // Allow requests from any origin to fetch the config
      response.headers.set('Access-Control-Allow-Origin', '*');
      
      return response;

    } catch (error) {
      console.error('Chat Config API Error:', error);
      return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
    }
}

export async function OPTIONS() {
  const response = new NextResponse(null, {
    status: 204,
  });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

    
