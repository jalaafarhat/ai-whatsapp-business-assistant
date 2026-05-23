import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './services/documents.service';
import { ChunkingService } from './services/chunking.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, ChunkingService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
