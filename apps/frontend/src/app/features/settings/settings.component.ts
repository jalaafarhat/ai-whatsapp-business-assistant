import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatSlideToggleModule,
  ],
  template: `
    <div class="space-y-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>

      <mat-tab-group>
        <!-- WhatsApp Configuration -->
        <mat-tab label="WhatsApp">
          <div class="p-6">
            <mat-card class="!shadow-sm">
              <mat-card-header>
                <mat-card-title>WhatsApp Business API Configuration</mat-card-title>
                <mat-card-subtitle>Connect your WhatsApp Business account</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content class="p-4 space-y-4">
                <mat-form-field class="w-full" appearance="outline">
                  <mat-label>Phone Number ID</mat-label>
                  <input matInput [(ngModel)]="waConfig.phoneNumberId" placeholder="From Meta Business Suite">
                </mat-form-field>
                <mat-form-field class="w-full" appearance="outline">
                  <mat-label>Access Token</mat-label>
                  <input matInput [(ngModel)]="waConfig.accessToken" type="password" placeholder="Permanent access token">
                </mat-form-field>
                <mat-form-field class="w-full" appearance="outline">
                  <mat-label>Business Name</mat-label>
                  <input matInput [(ngModel)]="waConfig.businessName">
                </mat-form-field>
                <button mat-flat-button color="primary" (click)="saveWhatsappConfig()">
                  Save Configuration
                </button>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Appearance -->
        <mat-tab label="Appearance">
          <div class="p-6">
            <mat-card class="!shadow-sm">
              <mat-card-content class="p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="font-medium text-gray-900 dark:text-white">Dark Mode</p>
                    <p class="text-sm text-gray-500">Toggle between light and dark theme</p>
                  </div>
                  <mat-slide-toggle
                    [checked]="themeService.darkMode()"
                    (change)="themeService.toggle()">
                  </mat-slide-toggle>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Organization -->
        <mat-tab label="Organization">
          <div class="p-6">
            <mat-card class="!shadow-sm">
              <mat-card-header>
                <mat-card-title>Organization Settings</mat-card-title>
              </mat-card-header>
              <mat-card-content class="p-4 space-y-4">
                <mat-form-field class="w-full" appearance="outline">
                  <mat-label>Organization Name</mat-label>
                  <input matInput [(ngModel)]="orgName">
                </mat-form-field>
                <button mat-flat-button color="primary" (click)="saveOrgSettings()">
                  Save Changes
                </button>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
})
export class SettingsComponent {
  waConfig = { phoneNumberId: '', accessToken: '', businessName: '' };
  orgName = '';

  constructor(
    private api: ApiService,
    private notification: NotificationService,
    public themeService: ThemeService,
  ) {}

  saveWhatsappConfig() {
    this.api.post('whatsapp/configure', this.waConfig).subscribe({
      next: () => this.notification.success('WhatsApp configuration saved'),
      error: () => this.notification.error('Failed to save configuration'),
    });
  }

  saveOrgSettings() {
    this.api.patch('organizations/current', { name: this.orgName }).subscribe({
      next: () => this.notification.success('Organization updated'),
      error: () => this.notification.error('Failed to update'),
    });
  }
}
