import { Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-700 to-primary-900 p-4">
      <div class="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div class="text-center mb-8">
          <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <mat-icon class="!text-3xl text-primary-600">chat</mat-icon>
          </div>
          <h1 class="text-2xl font-bold text-gray-900">Welcome Back</h1>
          <p class="text-gray-500 mt-2 text-sm">Sign in to your AI WhatsApp Assistant</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
          <mat-form-field class="w-full" appearance="outline">
            <mat-label>Email</mat-label>
            <mat-icon matTextPrefix class="mr-2 text-gray-400">email</mat-icon>
            <input matInput formControlName="email" type="email" placeholder="you&#64;example.com">
          </mat-form-field>

          <mat-form-field class="w-full" appearance="outline">
            <mat-label>Password</mat-label>
            <mat-icon matTextPrefix class="mr-2 text-gray-400">lock</mat-icon>
            <input matInput formControlName="password" [type]="hidePassword() ? 'password' : 'text'">
            <button mat-icon-button matTextSuffix type="button" (click)="hidePassword.set(!hidePassword())">
              <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
          </mat-form-field>

          <button
            mat-flat-button
            color="primary"
            class="w-full !h-12 !text-base !rounded-lg"
            type="submit"
            [disabled]="loading() || form.invalid">
            @if (loading()) {
              <mat-spinner diameter="20" class="inline-block mr-2"></mat-spinner>
            }
            Sign In
          </button>
        </form>

        <p class="text-center mt-8 text-sm text-gray-600">
          Don't have an account?
          <a routerLink="/auth/register" class="text-primary-600 font-semibold hover:underline ml-1">
            Sign up
          </a>
        </p>
      </div>
    </div>
  `,
})
export class LoginComponent {
  hidePassword = signal(true);
  loading = signal(false);
  form: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notification: NotificationService,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.loading.set(true);
    const { email, password } = this.form.value;

    this.authService.login(email!, password!).subscribe({
      next: () => {
        this.notification.success('Welcome back!');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.notification.error(err.error?.message || 'Login failed');
      },
    });
  }
}
