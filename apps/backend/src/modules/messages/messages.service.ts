import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { MessageDirection, MessageStatus, MessageType } from '@prisma/client';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async findByConversation(conversationId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
        include: {
          sentByUser: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.message.count({ where: { conversationId } }),
    ]);

    return {
      data: messages.reverse(),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async create(dto: CreateMessageDto & { conversationId: string; sentByUserId?: string }) {
    const message = await this.prisma.message.create({
      data: {
        conversationId: dto.conversationId,
        direction: dto.direction,
        type: dto.type || 'TEXT',
        content: dto.content,
        mediaUrl: dto.mediaUrl,
        waMessageId: dto.waMessageId,
        sentByUserId: dto.sentByUserId,
        status: dto.direction === 'OUTBOUND' ? 'SENT' : 'DELIVERED',
      },
    });

    await this.prisma.conversation.update({
      where: { id: dto.conversationId },
      data: {
        lastMessage: dto.content.substring(0, 200),
        lastMessageAt: new Date(),
        unreadCount: dto.direction === 'INBOUND' ? { increment: 1 } : undefined,
      },
    });

    return message;
  }

  async updateStatus(waMessageId: string, status: MessageStatus) {
    return this.prisma.message.updateMany({
      where: { waMessageId },
      data: { status },
    });
  }
}
