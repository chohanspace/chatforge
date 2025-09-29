
'use server';
/**
 * @fileOverview A flow to generate a direct email to a user.
 *
 * - generateDirectEmail - A function that generates an HTML email based on a prompt.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const GenerateDirectEmailSchema = z.object({
  prompt: z.string(),
  userName: z.string(),
});
type GenerateDirectEmailInput = z.infer<typeof GenerateDirectEmailSchema>;


const directEmailPrompt = ai.definePrompt({
  name: 'generateDirectEmailPrompt',
  input: { schema: GenerateDirectEmailSchema },
  model: 'googleai/gemini-1.5-pro-latest',
  prompt: `
    You are an expert email copywriter for a SaaS company called ChatForge AI.
    Your task is to generate a complete, responsive, and visually appealing HTML email based on the user's prompt.
    The output MUST be a single HTML file with inline CSS for maximum compatibility with email clients.
    Do not use any external stylesheets or links to external assets.
    Use a clean, modern design.
    The email should be addressed to the user by their name, which is provided.
    Ensure the design is professional and engaging.

    User's Name: {{userName}}

    The user's prompt is:
    ---
    "{{prompt}}"
    ---
  `,
});

const generateDirectEmailFlow = ai.defineFlow(
  {
    name: 'generateDirectEmailFlow',
    inputSchema: GenerateDirectEmailSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const { text } = await directEmailPrompt(input);
    return text;
  }
);


export async function generateDirectEmail(input: GenerateDirectEmailInput): Promise<string> {
  return generateDirectEmailFlow(input);
}
