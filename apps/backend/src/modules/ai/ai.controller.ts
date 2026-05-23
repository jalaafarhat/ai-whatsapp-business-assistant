import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AiService } from './services/ai.service';
import { SummarizationService } from './services/summarization.service';
import { SentimentService } from './services/sentiment.service';
import { RagService } from './services/rag.service';
import { GenerateReplyDto } from './dto/generate-reply.dto';
import { AskDocumentDto } from './dto/ask-document.dto';

@ApiTags('AI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly summarizationService: SummarizationService,
    private readonly sentimentService: SentimentService,
    private readonly ragService: RagService,
  ) {}

  @Post('summarize/:conversationId')
  @ApiOperation({ summary: 'Summarize a conversation' })
  async summarize(@Param('conversationId') conversationId: string) {
    return this.summarizationService.summarizeConversation(conversationId);
  }

  @Post('sentiment/:conversationId')
  @ApiOperation({ summary: 'Analyze conversation sentiment' })
  async analyzeSentiment(@Param('conversationId') conversationId: string) {
    return this.sentimentService.analyzeConversationSentiment(conversationId);
  }

  @Post('generate-reply')
  @ApiOperation({ summary: 'Generate AI reply suggestion' })
  async generateReply(@Body() dto: GenerateReplyDto) {
    return {
      reply: await this.aiService.generateReply(
        dto.conversationHistory,
        dto.customerMessage,
        dto.context,
      ),
    };
  }

  @Post('ask')
  @ApiOperation({ summary: 'Ask a question about uploaded documents' })
  async askDocument(
    @CurrentUser('organizationId') orgId: string,
    @Body() dto: AskDocumentDto,
  ) {
    return this.ragService.answerFromDocuments(orgId, dto.question);
  }

  @Post('tags/:conversationId')
  @ApiOperation({ summary: 'Generate smart tags for a conversation' })
  async generateTags(@Param('conversationId') conversationId: string) {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    try {
      const messages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { timestamp: 'asc' },
        take: 50,
      });
      const content = messages.map((m: any) => m.content).join('\n');
      const tags = await this.aiService.generateSmartTags(content);
      return { tags };
    } finally {
      await prisma.$disconnect();
    }
  }
}
