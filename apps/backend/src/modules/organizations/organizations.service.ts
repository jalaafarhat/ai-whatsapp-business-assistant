import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        subscription: true,
        _count: { select: { users: true, workspaces: true } },
      },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    return org;
  }

  async update(id: string, dto: UpdateOrganizationDto) {
    return this.prisma.organization.update({
      where: { id },
      data: dto,
    });
  }

  async getWorkspaces(organizationId: string) {
    return this.prisma.workspace.findMany({
      where: { organizationId },
      include: {
        _count: { select: { conversations: true } },
      },
    });
  }

  async createWorkspace(organizationId: string, name: string, description?: string) {
    return this.prisma.workspace.create({
      data: { name, description, organizationId },
    });
  }
}
