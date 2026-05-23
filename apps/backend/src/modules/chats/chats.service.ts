import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ConversationStatus } from '@prisma/client';

@Injectable()
export class ChatsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByWorkspace(
    workspaceId: string,
    params: { status?: ConversationStatus; page?: number; limit?: number; search?: string },
  ) {
    const { status, page = 1, limit = 20, search } = params;
    const skip = (page - 1) * limit;

    const where: any = { workspaceId };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { contact: { name: { contains: search, mode: 'insensitive' } } },
        { contact: { phone: { contains: search } } },
        { lastMessage: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        include: {
          contact: true,
          assignedTo: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        },
        orderBy: { lastMessageAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.conversation.count({ where }),
    ]);

    return {
      data: conversations,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        contact: true,
        assignedTo: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        summaries: { orderBy: { createdAt: 'desc' }, take: 1 },
        sentiments: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  async updateStatus(id: string, status: ConversationStatus) {
    return this.prisma.conversation.update({
      where: { id },
      data: { status },
    });
  }

  async assignAgent(conversationId: string, userId: string) {
    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: { assignedToId: userId },
    });
  }

  async getOrCreateConversation(contactWaId: string, workspaceId: string, contactName?: string) {
    let contact = await this.prisma.contact.findUnique({
      where: { waId: contactWaId },
    });

    if (!contact) {
      contact = await this.prisma.contact.create({
        data: {
          waId: contactWaId,
          phone: contactWaId,
          name: contactName,
        },
      });
    }

    let conversation = await this.prisma.conversation.findFirst({
      where: { contactId: contact.id, workspaceId, status: { not: 'CLOSED' } },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          contactId: contact.id,
          workspaceId,
          status: 'OPEN',
        },
      });
    }

    return { contact, conversation };
  }
}
