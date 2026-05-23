import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class SentimentService {
  private readonly logger = new Logger(SentimentService.name);
  private readonly genAI: GoogleGenerativeAI;
  private readonly modelName: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const apiKey = this.configService.get<string>('ai.googleApiKey');
    this.genAI = new GoogleGenerativeAI(apiKey!);
    this.modelName = this.configService.get<string>('ai.generativeModel') || 'gemini-2.0-flash';
  }

  async analyzeConversationSentiment(conversationId: string) {
    const messages = await this.prisma.message.findMany({
      where: { conversationId, direction: 'INBOUND' },
      orderBy: { timestamp: 'desc' },
      take: 20,
    });

    if (messages.length === 0) return null;

    const text = messages.map((m) => m.content).join('\n');

    const model = this.genAI.getGenerativeModel({ model: this.modelName });

    const prompt = `Analyze the sentiment of these customer messages. Respond in JSON:
{
  "sentiment": "POSITIVE" | "NEGATIVE" | "NEUTRAL" | "MIXED",
  "score": <number between -1.0 and 1.0>,
  "details": {
    "dominantEmotion": "...",
    "urgency": "low" | "medium" | "high",
    "satisfaction": "low" | "medium" | "high"
  }
}

Messages:
${text}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    try {
      const parsed = JSON.parse(responseText.replace(/```json\n?|\n?```/g, ''));

      const analysis = await this.prisma.sentimentAnalysis.create({
        data: {
          conversationId,
          sentiment: parsed.sentiment,
          score: parsed.score,
          details: parsed.details,
        },
      });

      return analysis;
    } catch (error) {
      this.logger.error('Failed to parse sentiment analysis', error);
      return null;
    }
  }
}
