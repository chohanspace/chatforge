import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    // The googleAI plugin is used for Gemini models
    googleAI({apiKey: process.env.GEMINI_API_KEY}),
  ],
});
