import { Component, OnInit, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">Message trends and communication insights</p>
      </div>

      @if (loading()) {
        <div class="flex justify-center py-12">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else {
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <mat-card class="!shadow-sm">
            <mat-card-header>
              <mat-card-title>Message Trends (30 days)</mat-card-title>
            </mat-card-header>
            <mat-card-content class="p-4">
              @if (trends().length === 0) {
                <p class="text-gray-500 text-sm py-8 text-center">No data available yet</p>
              } @else {
                <div class="space-y-2">
                  @for (day of trends().slice(-7); track day.date) {
                    <div class="flex items-center gap-3">
                      <span class="text-xs text-gray-500 w-20">{{ day.date }}</span>
                      <div class="flex-1 flex gap-1">
                        <div
                          class="h-5 bg-primary-500 rounded-sm"
                          [style.width.%]="getBarWidth(day.inbound)">
                        </div>
                        <div
                          class="h-5 bg-blue-400 rounded-sm"
                          [style.width.%]="getBarWidth(day.outbound)">
                        </div>
                      </div>
                      <span class="text-xs text-gray-600 dark:text-gray-400 w-12 text-right">{{ day.total }}</span>
                    </div>
                  }
                </div>
                <div class="flex gap-4 mt-4 text-xs text-gray-500">
                  <span class="flex items-center gap-1">
                    <span class="w-3 h-3 bg-primary-500 rounded-sm"></span> Inbound
                  </span>
                  <span class="flex items-center gap-1">
                    <span class="w-3 h-3 bg-blue-400 rounded-sm"></span> Outbound
                  </span>
                </div>
              }
            </mat-card-content>
          </mat-card>

          <mat-card class="!shadow-sm">
            <mat-card-header>
              <mat-card-title>Conversation Insights</mat-card-title>
            </mat-card-header>
            <mat-card-content class="p-4">
              <p class="text-gray-500 text-sm py-8 text-center">AI-powered insights will be generated as conversations accumulate</p>
            </mat-card-content>
          </mat-card>
        </div>
      }
    </div>
  `,
})
export class AnalyticsComponent implements OnInit {
  loading = signal(true);
  trends = signal<{ date: string; inbound: number; outbound: number; total: number }[]>([]);
  maxMessages = 0;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.get<any[]>('analytics/trends', { days: 30 }).subscribe({
      next: (data) => {
        this.trends.set(data);
        this.maxMessages = Math.max(...data.map((d) => d.total), 1);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  getBarWidth(count: number): number {
    return this.maxMessages > 0 ? (count / this.maxMessages) * 100 : 0;
  }
}
