import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly genAI: GoogleGenerativeAI;
  private readonly modelName: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('ai.googleApiKey');
    this.genAI = new GoogleGenerativeAI(apiKey!);
    this.modelName = this.configService.get<string>('ai.generativeModel') || 'gemini-2.0-flash';
  }

  async generateReply(conversationHistory: string, customerMessage: string, context?: string) {
    const model = this.genAI.getGenerativeModel({ model: this.modelName });

    const prompt = `You are a helpful business assistant. Based on the conversation history and any provided context, generate a professional, friendly reply to the customer's latest message.

${context ? `Business Context:\n${context}\n\n` : ''}Conversation History:
${conversationHistory}

Customer's Latest Message: ${customerMessage}

Generate a concise, helpful reply. Be professional but friendly. If you don't have enough information to answer, politely let the customer know and offer to connect them with a human agent.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  async generateSmartTags(conversationContent: string): Promise<string[]> {
    const model = this.genAI.getGenerativeModel({ model: this.modelName });

    const prompt = `Analyze this conversation and generate 2-5 relevant tags for categorization. Return ONLY a JSON array of strings, nothing else.

Conversation:
${conversationContent}

Tags should be short (1-3 words), lowercase, and relevant to the topic/intent. Examples: "billing inquiry", "product question", "complaint", "support request", "lead".`;

    const result = await model.generateContent(prompt);
    try {
      return JSON.parse(result.response.text());
    } catch {
      return [];
    }
  }

  async extractLeadInfo(conversationContent: string) {
    const model = this.genAI.getGenerativeModel({ model: this.modelName });

    const prompt = `Analyze this conversation and extract any lead/customer information mentioned. Return a JSON object with available fields: name, email, phone, company, interest, budget, timeline. Use null for missing fields.

Conversation:
${conversationContent}`;

    const result = await model.generateContent(prompt);
    try {
      return JSON.parse(result.response.text());
    } catch {
      return null;
    }
  }

  async answerQuestion(question: string, context: string): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: this.modelName });

    const prompt = `Based on the following context, answer the question. If the answer is not in the context, say so clearly.

Context:
${context}

Question: ${question}

Answer:`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  }
}
