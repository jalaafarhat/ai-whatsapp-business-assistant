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
  selector: 'app-register',
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
            <mat-icon class="!text-3xl text-primary-600">person_add</mat-icon>
          </div>
          <h1 class="text-2xl font-bold text-gray-900">Create Account</h1>
          <p class="text-gray-500 mt-2 text-sm">Start your free trial today</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <mat-form-field appearance="outline">
              <mat-label>First Name</mat-label>
              <input matInput formControlName="firstName">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Last Name</mat-label>
              <input matInput formControlName="lastName">
            </mat-form-field>
          </div>

          <mat-form-field class="w-full" appearance="outline">
            <mat-label>Organization Name</mat-label>
            <mat-icon matTextPrefix class="mr-2 text-gray-400">business</mat-icon>
            <input matInput formControlName="organizationName" placeholder="Your Company">
          </mat-form-field>

          <mat-form-field class="w-full" appearance="outline">
            <mat-label>Email</mat-label>
            <mat-icon matTextPrefix class="mr-2 text-gray-400">email</mat-icon>
            <input matInput formControlName="email" type="email">
          </mat-form-field>

          <mat-form-field class="w-full" appearance="outline">
            <mat-label>Password</mat-label>
            <mat-icon matTextPrefix class="mr-2 text-gray-400">lock</mat-icon>
            <input matInput formControlName="password" [type]="hidePassword() ? 'password' : 'text'">
            <button mat-icon-button matTextSuffix type="button" (click)="hidePassword.set(!hidePassword())">
              <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            <mat-hint>Min 8 characters</mat-hint>
          </mat-form-field>

          <button
            mat-flat-button
            color="primary"
            class="w-full !h-12 !text-base !rounded-lg !mt-6"
            type="submit"
            [disabled]="loading() || form.invalid">
            @if (loading()) {
              <mat-spinner diameter="20" class="inline-block mr-2"></mat-spinner>
            }
            Create Account
          </button>
        </form>

        <p class="text-center mt-8 text-sm text-gray-600">
          Already have an account?
          <a routerLink="/auth/login" class="text-primary-600 font-semibold hover:underline ml-1">
            Sign in
          </a>
        </p>
      </div>
    </div>
  `,
})
export class RegisterComponent {
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
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      organizationName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.authService.register(this.form.value as any).subscribe({
      next: () => {
        this.notification.success('Account created successfully!');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.notification.error(err.error?.message || 'Registration failed');
      },
    });
  }
}
