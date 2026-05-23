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
    const chunks = await this.prisma.documentChunk.findMany({
      where: {
        document: { organizationId, status: 'READY' },
      },
      select: {
        id: true,
        content: true,
        embedding: true,
        document: { select: { filename: true, originalName: true } },
      },
    });

    if (chunks.length === 0) {
      return [];
    }

    const queryEmbedding = await this.embeddingService.generateEmbedding(query);

    const scored = chunks
      .filter((chunk) => chunk.embedding && chunk.embedding.length > 0)
      .map((chunk) => ({
        ...chunk,
        score: this.embeddingService.cosineSimilarity(queryEmbedding, chunk.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return scored.map(({ embedding, ...rest }) => rest);
  }

  async answerFromDocuments(organizationId: string, question: string) {
    try {
      const relevantChunks = await this.searchDocuments(organizationId, question);

      if (relevantChunks.length === 0) {
        return {
          answer: 'No documents have been uploaded and processed yet. Please upload a PDF document first, then try asking your question again.',
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
    } catch (error) {
      this.logger.error('RAG answer failed', error);
      return {
        answer: 'Unable to process your question. Please ensure you have uploaded documents and they have finished processing.',
        sources: [],
      };
    }
  }
}
