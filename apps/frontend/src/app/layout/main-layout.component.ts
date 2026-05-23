import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../core/services/auth.service';
import { ThemeService } from '../core/services/theme.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatMenuModule,
    MatTooltipModule,
  ],
  template: `
    <mat-sidenav-container class="h-screen">
      <mat-sidenav
        mode="side"
        [opened]="sidenavOpen()"
        class="w-64 border-r border-gray-200 dark:border-gray-700">
        <div class="flex flex-col h-full bg-white dark:bg-gray-800">
          <!-- Logo -->
          <div class="p-4 border-b border-gray-200 dark:border-gray-700">
            <h1 class="text-xl font-bold text-primary-700 dark:text-primary-400">
              WA Assistant
            </h1>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">AI-Powered Business Chat</p>
          </div>

          <!-- Navigation -->
          <nav class="flex-1 p-3 space-y-1">
            @for (item of navItems; track item.path) {
              <a
                [routerLink]="item.path"
                routerLinkActive="bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400"
                class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <mat-icon class="text-[20px]">{{ item.icon }}</mat-icon>
                <span class="text-sm font-medium">{{ item.label }}</span>
              </a>
            }
          </nav>

          <!-- User section -->
          <div class="p-3 border-t border-gray-200 dark:border-gray-700">
            <button
              [matMenuTriggerFor]="userMenu"
              class="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <div class="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-medium">
                {{ authService.userFullName().charAt(0) }}
              </div>
              <div class="flex-1 text-left">
                <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ authService.userFullName() }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ authService.user()?.role }}</p>
              </div>
            </button>
            <mat-menu #userMenu="matMenu">
              <button mat-menu-item routerLink="/settings">
                <mat-icon>settings</mat-icon>
                <span>Settings</span>
              </button>
              <button mat-menu-item (click)="authService.logout()">
                <mat-icon>logout</mat-icon>
                <span>Logout</span>
              </button>
            </mat-menu>
          </div>
        </div>
      </mat-sidenav>

      <mat-sidenav-content class="bg-gray-50 dark:bg-gray-900">
        <!-- Top bar -->
        <mat-toolbar class="!bg-white dark:!bg-gray-800 border-b border-gray-200 dark:border-gray-700 !h-14">
          <button mat-icon-button (click)="toggleSidenav()">
            <mat-icon>menu</mat-icon>
          </button>
          <span class="flex-1"></span>
          <button mat-icon-button (click)="themeService.toggle()" matTooltip="Toggle theme">
            <mat-icon>{{ themeService.darkMode() ? 'light_mode' : 'dark_mode' }}</mat-icon>
          </button>
          <button mat-icon-button matTooltip="Notifications">
            <mat-icon>notifications_none</mat-icon>
          </button>
        </mat-toolbar>

        <!-- Page content -->
        <main class="p-6">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
})
export class MainLayoutComponent {
  sidenavOpen = signal(true);

  navItems = [
    { path: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { path: '/chats', icon: 'chat', label: 'Chats' },
    { path: '/analytics', icon: 'analytics', label: 'Analytics' },
    { path: '/documents', icon: 'description', label: 'Documents' },
    { path: '/billing', icon: 'payment', label: 'Billing' },
    { path: '/settings', icon: 'settings', label: 'Settings' },
  ];

  constructor(
    public authService: AuthService,
    public themeService: ThemeService,
  ) {}

  toggleSidenav() {
    this.sidenavOpen.update((v) => !v);
  }
}
