
'use server';
/**
 * @fileOverview A flow to generate a chatbot response based on custom instructions and Q&A, and to generate newsletter emails.
 *
 * - generateChatResponse - A function that generates the response.
 * - generateNewsletterEmail - A function that generates an HTML email for a newsletter.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

// --- Chatbot Response Generation ---

const GenerateChatResponseInputSchema = z.object({
  message: z.string().describe("The user's message to the chatbot."),
  instructions: z.string().describe("Custom instructions for the chatbot's personality and role."),
  qa: z.array(z.object({
    question: z.string(),
    answer: z.string()
  })).describe('A list of custom question and answer pairs.'),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.array(z.object({ text: z.string() }))
  })).describe('The history of the conversation.')
});
export type GenerateChatResponseInput = z.infer<typeof GenerateChatResponseInputSchema>;

const GenerateChatResponseOutputSchema = z.object({
  reply: z.string().describe("The chatbot's generated reply."),
});
export type GenerateChatResponseOutput = z.infer<typeof GenerateChatResponseOutputSchema>;


const chatPrompt = ai.definePrompt({
  name: 'generateChatResponsePrompt',
  input: { schema: GenerateChatResponseInputSchema },
  model: 'googleai/gemini-1.5-pro-latest',
  prompt: `
    You are a custom AI chatbot.

    Your personality and instructions are defined as follows:
    ---
    {{{instructions}}}
    ---

    You must adhere to these instructions strictly.

    The user has provided the following custom question and answer pairs. If the user's message is a close match to one of these questions, you MUST provide the corresponding answer exactly as written.
    ---
    {{#each qa}}
    Question: "{{question}}"
    Answer: "{{answer}}"
    {{/each}}
    ---
    
    {{#if history}}
    Here is the conversation history. Use it to provide context for your response. The roles will be 'user' and 'model'.
    ---
    {{#each history}}
    {{role}}: {{content.[0].text}}
    {{/each}}
    ---
    {{/if}}

    Now, please respond to the following user message:
    "{{message}}"
  `,
});

const generateChatResponseFlow = ai.defineFlow(
  {
    name: 'generateChatResponseFlow',
    inputSchema: GenerateChatResponseInputSchema,
    outputSchema: GenerateChatResponseOutputSchema,
  },
  async (input) => {
    const { text } = await chatPrompt(input);
    return { reply: text };
  }
);

export async function generateChatResponse(input: GenerateChatResponseInput): Promise<GenerateChatResponseOutput> {
  return generateChatResponseFlow(input);
}


const generateChatResponseStreamFlow = ai.defineFlow(
    {
      name: 'generateChatResponseStreamFlow',
      inputSchema: GenerateChatResponseInputSchema,
      stream: {
        schema: z.string(),
      },
    },
    async function* (input) {
      const {stream} = await chatPrompt(input, {stream: true});
      for await (const chunk of stream) {
        yield chunk.text;
      }
    }
);

export async function generateChatResponseStream(input: GenerateChatResponseInput) {
    const stream = generateChatResponseStreamFlow(input);
    return {
        stream: new ReadableStream({
            async start(controller) {
                for await (const chunk of stream) {
                    controller.enqueue(chunk);
                }
                controller.close();
            }
        }),
        response: stream.response
    }
}


// --- Newsletter Generation ---

const NewsletterInputSchema = z.object({
  prompt: z.string(),
});
type NewsletterInput = z.infer<typeof NewsletterInputSchema>;

export async function generateNewsletterEmail(input: NewsletterInput): Promise<string> {
  return generateNewsletterEmailFlow(input);
}

const newsletterPromptTemplate = ai.definePrompt({
  name: 'generateNewsletterEmailPrompt',
  input: { schema: NewsletterInputSchema },
  model: 'googleai/gemini-1.5-pro-latest',
  prompt: `
    You are an expert email designer and copywriter.
    Your task is to generate a complete, responsive, and visually appealing HTML email based on the user's prompt.
    The output MUST be a single HTML file with inline CSS for maximum compatibility with email clients.
    Do not use any external stylesheets or links to external assets.
    Use a clean, modern design with a clear call-to-action if appropriate.
    The email should be well-structured with tables for layout.
    Ensure the design is professional and engaging.

    The user's prompt is:
    ---
    "{{prompt}}"
    ---
  `,
});

const generateNewsletterEmailFlow = ai.defineFlow(
  {
    name: 'generateNewsletterEmailFlow',
    inputSchema: NewsletterInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const { text } = await newsletterPromptTemplate(input);
    return text;
  }
);
