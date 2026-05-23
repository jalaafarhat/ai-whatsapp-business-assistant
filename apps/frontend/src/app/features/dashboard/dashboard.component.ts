import { Component, OnInit, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';

interface DashboardStats {
  totalConversations: number;
  openConversations: number;
  totalMessages: number;
  todayMessages: number;
  responseRate: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">Overview of your WhatsApp business communications</p>
      </div>

      @if (loading()) {
        <div class="flex justify-center py-12">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else {
        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          @for (stat of statCards(); track stat.label) {
            <mat-card class="!shadow-sm hover:!shadow-md transition-shadow">
              <mat-card-content class="p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm text-gray-500 dark:text-gray-400">{{ stat.label }}</p>
                    <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">{{ stat.value }}</p>
                  </div>
                  <div [class]="'w-12 h-12 rounded-full flex items-center justify-center ' + stat.bgColor">
                    <mat-icon [class]="stat.iconColor">{{ stat.icon }}</mat-icon>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          }
        </div>

        <!-- Quick Actions -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <mat-card class="!shadow-sm">
            <mat-card-header>
              <mat-card-title class="!text-lg">Recent Conversations</mat-card-title>
            </mat-card-header>
            <mat-card-content class="p-4">
              <p class="text-gray-500 text-sm">No recent conversations yet. Connect your WhatsApp Business account to get started.</p>
            </mat-card-content>
          </mat-card>

          <mat-card class="!shadow-sm">
            <mat-card-header>
              <mat-card-title class="!text-lg">AI Insights</mat-card-title>
            </mat-card-header>
            <mat-card-content class="p-4">
              <p class="text-gray-500 text-sm">AI insights will appear here once you have active conversations.</p>
            </mat-card-content>
          </mat-card>
        </div>
      }
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  loading = signal(true);
  stats = signal<DashboardStats | null>(null);

  statCards = signal<{ label: string; value: string | number; icon: string; bgColor: string; iconColor: string }[]>([]);

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.get<DashboardStats>('analytics/dashboard').subscribe({
      next: (data) => {
        this.stats.set(data);
        this.statCards.set([
          { label: 'Total Conversations', value: data.totalConversations, icon: 'chat', bgColor: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600' },
          { label: 'Open Chats', value: data.openConversations, icon: 'mark_chat_unread', bgColor: 'bg-green-100 dark:bg-green-900/30', iconColor: 'text-green-600' },
          { label: 'Messages Today', value: data.todayMessages, icon: 'message', bgColor: 'bg-purple-100 dark:bg-purple-900/30', iconColor: 'text-purple-600' },
          { label: 'Total Messages', value: data.totalMessages, icon: 'forum', bgColor: 'bg-orange-100 dark:bg-orange-900/30', iconColor: 'text-orange-600' },
        ]);
        this.loading.set(false);
      },
      error: () => {
        this.statCards.set([
          { label: 'Total Conversations', value: 0, icon: 'chat', bgColor: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600' },
          { label: 'Open Chats', value: 0, icon: 'mark_chat_unread', bgColor: 'bg-green-100 dark:bg-green-900/30', iconColor: 'text-green-600' },
          { label: 'Messages Today', value: 0, icon: 'message', bgColor: 'bg-purple-100 dark:bg-purple-900/30', iconColor: 'text-purple-600' },
          { label: 'Total Messages', value: 0, icon: 'forum', bgColor: 'bg-orange-100 dark:bg-orange-900/30', iconColor: 'text-orange-600' },
        ]);
        this.loading.set(false);
      },
    });
  }
}
