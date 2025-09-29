// src/app/api/chat/[[...chat]]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { generateChatResponse, generateChatResponseStream } from '@/ai/flows/generate-chat-response';
import { ObjectId } from 'mongodb';

export async function POST(req: NextRequest) {
    const { message, apiKey, history, stream } = await req.json();
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required.' }, { status: 401 });
    }
    
    if (!message) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    const db = await getDb();
    // Find the specific chatbot by its API key
    const chatbot = await db.collection('chatbots').findOne({ apiKey });

    if (!chatbot) {
        return NextResponse.json({ error: 'Invalid API key.' }, { status: 401 });
    }

    // --- Domain Authorization Check ---
    const origin = req.headers.get('origin');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const allowedDomains = chatbot.authorizedDomains || [];
    
    // The test page is on the same origin, so we allow it.
    const isTestPage = origin === appUrl;

    if (origin && !isTestPage && allowedDomains.length > 0) {
        const originHost = new URL(origin).hostname;
        const isAuthorized = allowedDomains.some((domain: string) => {
            const domainPattern = new RegExp(`^(.+\\.)?${domain.replace('.', '\\.')}$`);
            return domainPattern.test(originHost);
        });

        if (!isAuthorized) {
             return NextResponse.json({ reply: `This chatbot is not authorized to be used on this domain. Please contact the site administrator.` });
        }
    }
    
    // Find the owner of the chatbot
    let user = await db.collection('users').findOne({ _id: chatbot.userId });

    if (!user) {
        // This case should ideally not happen if data integrity is maintained
        return NextResponse.json({ error: 'Chatbot owner not found.' }, { status: 500 });
    }

    if (user.isBanned) {
      return NextResponse.json({ error: 'This API key has been disabled.' }, { status: 403 });
    }

    // --- Message Limit and Cycle Reset Logic ---
    const now = new Date();
    const cycleStartDate = user.planCycleStartDate ? new Date(user.planCycleStartDate) : new Date(0);
    const cycleEndDate = new Date(cycleStartDate.getTime());
    cycleEndDate.setDate(cycleEndDate.getDate() + 30);

    let updates: any = {};
    if (now > cycleEndDate) {
        // More than 30 days have passed, reset the cycle.
        updates = {
            $set: { 
                messagesSent: 1, // Count the current message
                planCycleStartDate: now 
            }
        };
        // Update user object for the check below
        user.messagesSent = 1;
    } else {
        if (user.messagesSent >= user.messageLimit) {
            return NextResponse.json({ error: 'Monthly message limit reached. Please upgrade your plan.' }, { status: 429 });
        }
        updates = { $inc: { messagesSent: 1 } };
    }
    
    // Atomically update the user's message count
    await db.collection('users').updateOne(
        { _id: new ObjectId(user._id) },
        updates
    );

    const flowInput = {
        message,
        instructions: chatbot.instructions || 'You are a helpful assistant.',
        qa: chatbot.qa || [],
        history: history || [],
    };
    
    if (stream) {
      const { stream: aiStream, response } = await generateChatResponseStream(flowInput);
      response.catch(err => console.error("Error in streaming response:", err)); // Don't block the response
      return new Response(aiStream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        }
      });
    } else {
       const aiResponse = await generateChatResponse(flowInput);
       return NextResponse.json({ reply: aiResponse.reply });
    }
}

export async function OPTIONS() {
    return NextResponse.json({}, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
    })
}
