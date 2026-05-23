import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly genAI: GoogleGenerativeAI;
  private readonly embeddingModel: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('ai.googleApiKey');
    this.genAI = new GoogleGenerativeAI(apiKey!);
    this.embeddingModel = this.configService.get<string>('ai.embeddingModel') || 'embedding-001';
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.embeddingModel });
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch (error: any) {
      if (error.message?.includes('not found')) {
        const fallbackModel = this.genAI.getGenerativeModel({ model: 'embedding-001' });
        const result = await fallbackModel.embedContent(text);
        return result.embedding.values;
      }
      throw error;
    }
  }

  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];

    for (const text of texts) {
      const embedding = await this.generateEmbedding(text);
      embeddings.push(embedding);
    }

    return embeddings;
  }

  cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
