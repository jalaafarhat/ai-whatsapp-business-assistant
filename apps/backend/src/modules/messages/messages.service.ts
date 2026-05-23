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
    const direction = dto.direction || 'OUTBOUND';
    const message = await this.prisma.message.create({
      data: {
        conversationId: dto.conversationId,
        direction,
        type: dto.type || 'TEXT',
        content: dto.content,
        mediaUrl: dto.mediaUrl,
        waMessageId: dto.waMessageId,
        sentByUserId: dto.sentByUserId,
        status: direction === 'OUTBOUND' ? 'SENT' : 'DELIVERED',
      },
    });

    const updateData: any = {
      lastMessage: dto.content.substring(0, 200),
      lastMessageAt: new Date(),
    };
    if (direction === 'INBOUND') {
      updateData.unreadCount = { increment: 1 };
    }
    await this.prisma.conversation.update({
      where: { id: dto.conversationId },
      data: updateData,
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
