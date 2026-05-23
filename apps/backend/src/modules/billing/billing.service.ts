import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { getBillingPlan } from '../../config/billing-plans.config';
import Stripe from 'stripe';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secretKey = this.configService.get<string>('stripe.secretKey');
    if (!secretKey || secretKey.includes('your-stripe')) {
      this.logger.warn('Stripe secret key is not configured');
    }

    this.stripe = new Stripe(secretKey!, {
      apiVersion: '2025-02-24.acacia',
    });
  }

  async createCheckoutSession(
    organizationId: string,
    planId: string,
    successUrl: string,
    cancelUrl: string,
  ) {
    const plan = getBillingPlan(planId);
    if (!plan) {
      throw new BadRequestException(`Unknown plan: ${planId}`);
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { organizationId },
    });

    if (!subscription) {
      throw new BadRequestException('No subscription record found for this organization');
    }

    let customerId = subscription.stripeCustomerId;

    if (!customerId) {
      const org = await this.prisma.organization.findUnique({ where: { id: organizationId } });
      const customer = await this.stripe.customers.create({ name: org!.name });
      customerId = customer.id;

      await this.prisma.subscription.update({
        where: { organizationId },
        data: { stripeCustomerId: customerId },
      });
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: plan.currency,
            product_data: {
              name: `${plan.name} Plan`,
              description: plan.description,
            },
            unit_amount: plan.amount,
            recurring: { interval: plan.interval },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        organizationId,
        plan: plan.id,
      },
    });

    return { sessionId: session.id, url: session.url };
  }

  async createPortalSession(organizationId: string, returnUrl: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { organizationId },
    });

    if (!subscription?.stripeCustomerId) {
      throw new BadRequestException('No billing account found');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: returnUrl,
    });

    return { url: session.url };
  }

  async handleWebhook(payload: Buffer, signature: string) {
    const webhookSecret = this.configService.get<string>('stripe.webhookSecret');

    const event = this.stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret!,
    );

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionCanceled(event.data.object as Stripe.Subscription);
        break;
    }

    return { received: true };
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const organizationId = session.metadata?.organizationId;
    const plan = session.metadata?.plan;

    if (!organizationId || !session.subscription) {
      return;
    }

    await this.prisma.subscription.update({
      where: { organizationId },
      data: {
        stripeSubscriptionId: session.subscription as string,
        plan: plan as any,
        status: 'ACTIVE',
      },
    });
  }

  private async handleSubscriptionUpdate(subscription: Stripe.Subscription) {
    const statusMap: Record<string, any> = {
      active: 'ACTIVE',
      past_due: 'PAST_DUE',
      canceled: 'CANCELED',
      trialing: 'TRIALING',
      incomplete: 'INCOMPLETE',
    };

    await this.prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: statusMap[subscription.status] || 'ACTIVE',
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });
  }

  private async handleSubscriptionCanceled(subscription: Stripe.Subscription) {
    await this.prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: { status: 'CANCELED', plan: 'FREE' },
    });
  }

  async getSubscription(organizationId: string) {
    return this.prisma.subscription.findUnique({
      where: { organizationId },
    });
  }
}
