import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  async getDashboardStats(@CurrentUser('organizationId') orgId: string) {
    return this.analyticsService.getDashboardStats(orgId);
  }

  @Get('trends')
  @ApiOperation({ summary: 'Get message trends' })
  async getMessageTrends(
    @CurrentUser('organizationId') orgId: string,
    @Query('days') days?: number,
  ) {
    return this.analyticsService.getMessageTrends(orgId, days);
  }
}
