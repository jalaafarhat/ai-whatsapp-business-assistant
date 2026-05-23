import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { EmbeddingService } from './embedding.service';
import { AiService } from './ai.service';

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingService: EmbeddingService,
    private readonly aiService: AiService,
  ) {}

  async searchDocuments(organizationId: string, query: string, topK = 5) {
    const queryEmbedding = await this.embeddingService.generateEmbedding(query);

    const chunks = await this.prisma.documentChunk.findMany({
      where: {
        document: { organizationId },
      },
      select: {
        id: true,
        content: true,
        embedding: true,
        document: { select: { filename: true, originalName: true } },
      },
    });

    const scored = chunks
      .map((chunk) => ({
        ...chunk,
        score: this.embeddingService.cosineSimilarity(queryEmbedding, chunk.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return scored.map(({ embedding, ...rest }) => rest);
  }

  async answerFromDocuments(organizationId: string, question: string) {
    const relevantChunks = await this.searchDocuments(organizationId, question);

    if (relevantChunks.length === 0) {
      return {
        answer: 'No relevant documents found to answer your question.',
        sources: [],
      };
    }

    const context = relevantChunks.map((c) => c.content).join('\n\n---\n\n');
    const answer = await this.aiService.answerQuestion(question, context);

    return {
      answer,
      sources: relevantChunks.map((c) => ({
        document: c.document.originalName,
        excerpt: c.content.substring(0, 200),
        score: c.score,
      })),
    };
  }
}
