import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.stripe = new Stripe(this.configService.get<string>('stripe.secretKey')!, {
      apiVersion: '2025-02-24.acacia',
    });
  }

  async createCheckoutSession(organizationId: string, priceId: string, successUrl: string, cancelUrl: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { organizationId },
    });

    let customerId = subscription?.stripeCustomerId;

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
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { organizationId },
    });

    return { sessionId: session.id, url: session.url };
  }

  async createPortalSession(organizationId: string, returnUrl: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { organizationId },
    });

    if (!subscription?.stripeCustomerId) {
      throw new Error('No billing account found');
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
      data: { status: 'CANCELED' },
    });
  }

  async getSubscription(organizationId: string) {
    return this.prisma.subscription.findUnique({
      where: { organizationId },
    });
  }
}
