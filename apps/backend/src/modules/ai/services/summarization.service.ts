import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class SummarizationService {
  private readonly logger = new Logger(SummarizationService.name);
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

  async summarizeConversation(conversationId: string) {
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { timestamp: 'asc' },
      take: 100,
    });

    if (messages.length === 0) return null;

    const conversationText = messages
      .map((m) => `[${m.direction}] ${m.content}`)
      .join('\n');

    const model = this.genAI.getGenerativeModel({ model: this.modelName });

    const prompt = `Summarize this customer conversation. Provide:
1. A brief summary (2-3 sentences)
2. Key points discussed (bullet list)
3. Action items if any

Conversation:
${conversationText}

Respond in JSON format:
{
  "summary": "...",
  "keyPoints": ["..."],
  "actionItems": ["..."]
}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    try {
      const parsed = JSON.parse(responseText.replace(/```json\n?|\n?```/g, ''));

      const summary = await this.prisma.aiSummary.create({
        data: {
          conversationId,
          summary: parsed.summary,
          keyPoints: parsed.keyPoints || [],
          actionItems: parsed.actionItems || [],
        },
      });

      return summary;
    } catch (error) {
      this.logger.error('Failed to parse AI summary response', error);
      return null;
    }
  }
}
