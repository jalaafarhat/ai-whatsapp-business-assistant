import { registerAs } from '@nestjs/config';

export default registerAs('ai', () => ({
  googleApiKey: process.env.GOOGLE_API_KEY,
  embeddingModel: 'text-embedding-004',
  generativeModel: 'gemini-2.0-flash',
  maxTokens: 4096,
  temperature: 0.7,
}));
