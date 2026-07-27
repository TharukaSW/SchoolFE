import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { API_BASE } from './config';
import { AuthUser } from './models';

const TOKEN_KEY = 'sms_token';
const USER_KEY = 'sms_user';

@Injectable({ providedIn: 'root' })
export class Auth {
  private http = inject(HttpClient);

  readonly user = signal<AuthUser | null>(readStoredUser());
  readonly isAuthenticated = computed(() => !!this.user());
  readonly isAdmin = computed(() => this.user()?.role === 'admin');

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  login(email: string, password: string) {
    return this.http
      .post<{ token: string; user: AuthUser }>(`${API_BASE}/auth/login`, { email, password })
      .pipe(tap((res) => this.persist(res.token, res.user)));
  }

  register(body: { name: string; email: string; password: string; role?: string }) {
    return this.http
      .post<{ token: string; user: AuthUser }>(`${API_BASE}/auth/register`, body)
      .pipe(tap((res) => this.persist(res.token, res.user)));
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.user.set(null);
  }

  private persist(token: string, user: AuthUser) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.user.set(user);
  }
}

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}
