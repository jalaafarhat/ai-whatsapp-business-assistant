import { Component, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';

interface Plan {
  name: string;
  price: string;
  features: string[];
  planId: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  recommended?: boolean;
}

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Billing & Plans</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">Manage your subscription and billing</p>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Current Plan</p>
            <p class="text-xl font-bold text-gray-900 dark:text-white">{{ currentPlan() }}</p>
          </div>
          <span class="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            {{ subscriptionStatus() }}
          </span>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        @for (plan of plans; track plan.name) {
          <div [class]="plan.recommended
            ? 'bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 border-primary-500'
            : 'bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700'">
            @if (plan.recommended) {
              <span class="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase">Recommended</span>
            }
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mt-2">{{ plan.name }}</h3>
            <p class="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {{ plan.price }}
              <span class="text-sm font-normal text-gray-500 dark:text-gray-400">/month</span>
            </p>
            <ul class="mt-4 space-y-2">
              @for (feature of plan.features; track feature) {
                <li class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <mat-icon class="!text-[16px] text-primary-500">check_circle</mat-icon>
                  {{ feature }}
                </li>
              }
            </ul>
            <button
              mat-flat-button
              [color]="plan.recommended ? 'primary' : undefined"
              class="w-full !mt-6 !h-10"
              [disabled]="currentPlan() === plan.planId || upgrading()"
              (click)="selectPlan(plan)">
              {{ currentPlan() === plan.planId ? 'Current Plan' : (upgrading() ? 'Redirecting...' : 'Upgrade') }}
            </button>
          </div>
        }
      </div>
    </div>
  `,
})
export class BillingComponent implements OnInit {
  currentPlan = signal('FREE');
  subscriptionStatus = signal('ACTIVE');
  upgrading = signal(false);

  plans: Plan[] = [
    {
      name: 'Starter',
      price: '$29',
      planId: 'STARTER',
      features: ['1,000 messages/mo', '5 AI summaries/day', '2 team members', 'Basic analytics'],
    },
    {
      name: 'Professional',
      price: '$79',
      planId: 'PROFESSIONAL',
      recommended: true,
      features: ['10,000 messages/mo', 'Unlimited AI features', '10 team members', 'Advanced analytics', 'RAG documents', 'Priority support'],
    },
    {
      name: 'Enterprise',
      price: '$199',
      planId: 'ENTERPRISE',
      features: ['Unlimited messages', 'Unlimited AI features', 'Unlimited team', 'Custom integrations', 'Dedicated support', 'SLA guarantee'],
    },
  ];

  constructor(
    private api: ApiService,
    private notification: NotificationService,
  ) {}

  ngOnInit() {
    this.api.get<any>('billing/subscription').subscribe({
      next: (sub) => {
        if (sub) {
          this.currentPlan.set(sub.plan);
          this.subscriptionStatus.set(sub.status);
        }
      },
    });
  }

  selectPlan(plan: Plan) {
    this.upgrading.set(true);

    this.api.post<{ url: string }>('billing/checkout', {
      plan: plan.planId,
      successUrl: `${window.location.origin}/billing?success=true`,
      cancelUrl: `${window.location.origin}/billing?canceled=true`,
    }).subscribe({
      next: (res) => {
        if (res?.url) {
          window.location.href = res.url;
          return;
        }
        this.upgrading.set(false);
        this.notification.error('Could not create checkout session. Please try again.');
      },
      error: (err: HttpErrorResponse) => {
        this.upgrading.set(false);
        const message = err.error?.message;
        this.notification.error(
          typeof message === 'string' ? message : 'Failed to start checkout. Please try again.',
        );
      },
    });
  }
}
