import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/interfaces/role.enum';

@ApiTags('Organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get('current')
  @ApiOperation({ summary: 'Get current organization' })
  async getCurrent(@CurrentUser('organizationId') orgId: string) {
    return this.organizationsService.findById(orgId);
  }

  @Patch('current')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update current organization' })
  async update(
    @CurrentUser('organizationId') orgId: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(orgId, dto);
  }

  @Get('workspaces')
  @ApiOperation({ summary: 'Get all workspaces' })
  async getWorkspaces(@CurrentUser('organizationId') orgId: string) {
    return this.organizationsService.getWorkspaces(orgId);
  }

  @Post('workspaces')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Create a workspace' })
  async createWorkspace(
    @CurrentUser('organizationId') orgId: string,
    @Body() dto: CreateWorkspaceDto,
  ) {
    return this.organizationsService.createWorkspace(orgId, dto.name, dto.description);
  }
}
