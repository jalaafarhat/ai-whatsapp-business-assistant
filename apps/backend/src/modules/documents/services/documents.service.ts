import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { ChunkingService } from './chunking.service';
import { EmbeddingService } from '../../ai/services/embedding.service';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly chunkingService: ChunkingService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  async findAllByOrganization(organizationId: string) {
    return this.prisma.document.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        filename: true,
        originalName: true,
        mimeType: true,
        size: true,
        status: true,
        chunkCount: true,
        createdAt: true,
      },
    });
  }

  async upload(
    organizationId: string,
    file: { filename: string; originalname: string; mimetype: string; size: number; buffer: Buffer },
  ) {
    const document = await this.prisma.document.create({
      data: {
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        status: 'PROCESSING',
        organizationId,
      },
    });

    this.processDocument(document.id, file.buffer).catch((err) => {
      this.logger.error(`Document processing failed: ${document.id}`, err);
    });

    return document;
  }

  private async processDocument(documentId: string, buffer: Buffer) {
    try {
      const text = await this.extractText(buffer);
      const chunks = this.chunkingService.chunkText(text);

      for (let i = 0; i < chunks.length; i++) {
        const embedding = await this.embeddingService.generateEmbedding(chunks[i]);
        await this.prisma.documentChunk.create({
          data: {
            documentId,
            content: chunks[i],
            embedding,
            chunkIndex: i,
          },
        });
      }

      await this.prisma.document.update({
        where: { id: documentId },
        data: { status: 'READY', chunkCount: chunks.length },
      });

      this.logger.log(`Document ${documentId} processed: ${chunks.length} chunks`);
    } catch (error) {
      await this.prisma.document.update({
        where: { id: documentId },
        data: { status: 'FAILED' },
      });
      throw error;
    }
  }

  private async extractText(buffer: Buffer): Promise<string> {
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);
    return data.text;
  }

  async delete(id: string, organizationId: string) {
    const doc = await this.prisma.document.findFirst({
      where: { id, organizationId },
    });

    if (!doc) throw new NotFoundException('Document not found');

    await this.prisma.document.delete({ where: { id } });
    return { deleted: true };
  }
}
