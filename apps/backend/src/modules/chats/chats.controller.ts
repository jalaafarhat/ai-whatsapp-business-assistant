import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ChatsService } from './chats.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ConversationStatus } from '@prisma/client';

@ApiTags('Chats')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Get(':workspaceId')
  @ApiOperation({ summary: 'Get all conversations in a workspace' })
  @ApiQuery({ name: 'status', required: false, enum: ConversationStatus })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @Param('workspaceId') workspaceId: string,
    @Query('status') status?: ConversationStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.chatsService.findAllByWorkspace(workspaceId, { status, page, limit, search });
  }

  @Get('conversation/:id')
  @ApiOperation({ summary: 'Get a conversation by ID' })
  async findOne(@Param('id') id: string) {
    return this.chatsService.findById(id);
  }

  @Patch('conversation/:id/status')
  @ApiOperation({ summary: 'Update conversation status' })
  async updateStatus(
    @Param('id') id: string,
    @Query('status') status: ConversationStatus,
  ) {
    return this.chatsService.updateStatus(id, status);
  }

  @Patch('conversation/:id/assign/:userId')
  @ApiOperation({ summary: 'Assign agent to conversation' })
  async assignAgent(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.chatsService.assignAgent(id, userId);
  }
}
