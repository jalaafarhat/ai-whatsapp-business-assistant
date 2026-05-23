import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats(organizationId: string) {
    const workspaces = await this.prisma.workspace.findMany({
      where: { organizationId },
      select: { id: true },
    });

    const workspaceIds = workspaces.map((w) => w.id);

    const [
      totalConversations,
      openConversations,
      totalMessages,
      todayMessages,
    ] = await Promise.all([
      this.prisma.conversation.count({
        where: { workspaceId: { in: workspaceIds } },
      }),
      this.prisma.conversation.count({
        where: { workspaceId: { in: workspaceIds }, status: 'OPEN' },
      }),
      this.prisma.message.count({
        where: { conversation: { workspaceId: { in: workspaceIds } } },
      }),
      this.prisma.message.count({
        where: {
          conversation: { workspaceId: { in: workspaceIds } },
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
    ]);

    return {
      totalConversations,
      openConversations,
      totalMessages,
      todayMessages,
      responseRate: totalConversations > 0 ? Math.round((openConversations / totalConversations) * 100) : 0,
    };
  }

  async getMessageTrends(organizationId: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const workspaces = await this.prisma.workspace.findMany({
      where: { organizationId },
      select: { id: true },
    });

    const workspaceIds = workspaces.map((w) => w.id);

    const messages = await this.prisma.message.findMany({
      where: {
        conversation: { workspaceId: { in: workspaceIds } },
        createdAt: { gte: startDate },
      },
      select: { createdAt: true, direction: true },
      orderBy: { createdAt: 'asc' },
    });

    const dailyStats: Record<string, { inbound: number; outbound: number }> = {};

    messages.forEach((msg) => {
      const day = msg.createdAt.toISOString().split('T')[0];
      if (!dailyStats[day]) dailyStats[day] = { inbound: 0, outbound: 0 };
      if (msg.direction === 'INBOUND') dailyStats[day].inbound++;
      else dailyStats[day].outbound++;
    });

    return Object.entries(dailyStats).map(([date, stats]) => ({
      date,
      ...stats,
      total: stats.inbound + stats.outbound,
    }));
  }
}
