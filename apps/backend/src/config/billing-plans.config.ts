export type BillingPlanId = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';

export interface BillingPlan {
  id: BillingPlanId;
  name: string;
  amount: number;
  currency: string;
  interval: 'month';
  description: string;
}

export const BILLING_PLANS: Record<BillingPlanId, BillingPlan> = {
  STARTER: {
    id: 'STARTER',
    name: 'Starter',
    amount: 2900,
    currency: 'usd',
    interval: 'month',
    description: 'Starter plan - 1,000 messages/mo',
  },
  PROFESSIONAL: {
    id: 'PROFESSIONAL',
    name: 'Professional',
    amount: 7900,
    currency: 'usd',
    interval: 'month',
    description: 'Professional plan - 10,000 messages/mo',
  },
  ENTERPRISE: {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    amount: 19900,
    currency: 'usd',
    interval: 'month',
    description: 'Enterprise plan - unlimited messages',
  },
};

export function getBillingPlan(planId: string): BillingPlan | undefined {
  return BILLING_PLANS[planId as BillingPlanId];
}
