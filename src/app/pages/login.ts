import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../core/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-wrap">
      <div class="login-card">
        <h1 style="font-size:22px">{{ mode() === 'login' ? 'Welcome back' : 'Create first admin' }}</h1>
        <p class="muted" style="margin:6px 0 22px">
          {{ mode() === 'login' ? 'Sign in to Sandagala Special School' : 'Set up the initial administrator account' }}
        </p>

        <div *ngIf="error()" class="alert alert-error">{{ error() }}</div>

        <form (ngSubmit)="submit()">
          <div class="field" *ngIf="mode() === 'register'" style="margin-bottom:14px">
            <label>Full name</label>
            <input [(ngModel)]="name" name="name" required autocomplete="name" />
          </div>
          <div class="field" style="margin-bottom:14px">
            <label>Email</label>
            <input type="email" [(ngModel)]="email" name="email" required autocomplete="username" />
          </div>
          <div class="field" style="margin-bottom:20px">
            <label>Password</label>
            <input type="password" [(ngModel)]="password" name="password" required autocomplete="current-password" />
          </div>
          <button class="btn btn-primary btn-block" type="submit" [disabled]="loading()">
            {{ loading() ? 'Please wait…' : mode() === 'login' ? 'Sign in' : 'Create admin' }}
          </button>
        </form>

        <div class="login-demo" *ngIf="mode() === 'login'">
          <strong>Demo accounts (after seeding):</strong><br />
          Admin — admin&#64;school.edu / admin123<br />
          Teacher — sarah.johnson&#64;school.edu / teacher123
        </div>

        <p class="center mt-2" style="font-size:13px">
          <a href="javascript:void(0)" (click)="toggle()">
            {{ mode() === 'login' ? 'First run? Create the initial admin' : 'Back to sign in' }}
          </a>
        </p>
      </div>
    </div>
  `,
})
export class LoginPage {
  private auth = inject(Auth);
  private router = inject(Router);

  mode = signal<'login' | 'register'>('login');
  loading = signal(false);
  error = signal('');

  name = '';
  email = '';
  password = '';

  toggle() {
    this.error.set('');
    this.mode.set(this.mode() === 'login' ? 'register' : 'login');
  }

  submit() {
    this.error.set('');
    this.loading.set(true);
    const done = {
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err: any) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Something went wrong. Please try again.');
      },
    };

    if (this.mode() === 'login') {
      this.auth.login(this.email, this.password).subscribe(done);
    } else {
      this.auth.register({ name: this.name, email: this.email, password: this.password, role: 'admin' }).subscribe(done);
    }
  }
}
