import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './services/ai.service';
import { EmbeddingService } from './services/embedding.service';
import { SummarizationService } from './services/summarization.service';
import { SentimentService } from './services/sentiment.service';
import { RagService } from './services/rag.service';

@Module({
  controllers: [AiController],
  providers: [AiService, EmbeddingService, SummarizationService, SentimentService, RagService],
  exports: [AiService, EmbeddingService, SummarizationService, SentimentService, RagService],
})
export class AiModule {}
