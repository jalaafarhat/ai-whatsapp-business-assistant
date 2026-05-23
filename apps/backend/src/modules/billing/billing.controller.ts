import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Headers,
  UseGuards,
  RawBodyRequest,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/interfaces/role.enum';
import { CreateCheckoutDto } from './dto/create-checkout.dto';

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('subscription')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current subscription' })
  async getSubscription(@CurrentUser('organizationId') orgId: string) {
    return this.billingService.getSubscription(orgId);
  }

  @Post('checkout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a checkout session' })
  async createCheckout(
    @CurrentUser('organizationId') orgId: string,
    @Body() dto: CreateCheckoutDto,
  ) {
    return this.billingService.createCheckoutSession(
      orgId,
      dto.plan,
      dto.successUrl,
      dto.cancelUrl,
    );
  }

  @Post('portal')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a billing portal session' })
  async createPortal(
    @CurrentUser('organizationId') orgId: string,
    @Body('returnUrl') returnUrl: string,
  ) {
    return this.billingService.createPortalSession(orgId, returnUrl);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Handle Stripe webhook events' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.billingService.handleWebhook(req.rawBody!, signature);
  }
}
