import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Auth } from '../core/auth';

interface NavItem { path: string; label: string; admin?: boolean; }

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand">
          <div>
            <div class="title">Sandagala Special School</div>
            <div class="subtitle">Special Needs · Management</div>
          </div>
        </div>

        <nav class="nav">
          <ng-container *ngFor="let group of groups">
            <div class="nav-section">{{ group.name }}</div>
            <ng-container *ngFor="let item of group.items">
              <a *ngIf="!item.admin || isAdmin()"
                 class="nav-link" [routerLink]="item.path" routerLinkActive="active">
                {{ item.label }}
              </a>
            </ng-container>
          </ng-container>
        </nav>

        <div class="sidebar-foot">
          Signed in as<br /><strong style="color:#fff">{{ user()?.name }}</strong>
        </div>
      </aside>

      <div class="main">
        <header class="topbar">
          <div class="crumb">{{ user()?.role === 'admin' ? 'Administrator' : 'Teacher' }} Portal</div>
          <div class="user">
            <span class="badge" [class.badge-primary]="isAdmin()" [class.badge-info]="!isAdmin()">
              {{ user()?.role | titlecase }}
            </span>
            <div class="avatar">{{ initials() }}</div>
            <button class="btn btn-outline btn-sm" (click)="logout()">Sign out</button>
          </div>
        </header>
        <main class="content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class Shell {
  private auth = inject(Auth);
  private router = inject(Router);

  user = this.auth.user;
  isAdmin = this.auth.isAdmin;
  initials = computed(() => {
    const n = this.user()?.name ?? '';
    return n.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  });

  groups: { name: string; items: NavItem[] }[] = [
    { name: 'Overview', items: [{ path: '/dashboard', label: 'Dashboard' }] },
    {
      name: 'People',
      items: [
        { path: '/students', label: 'Students' },
        { path: '/teachers', label: 'Teachers' },
        { path: '/achievements', label: 'Achievements' },
      ],
    },
    {
      name: 'Academics',
      items: [
        { path: '/timetable', label: 'Timetable' },
        { path: '/marks', label: 'Marks' },
        { path: '/ranking', label: 'Rankings & Colours' },
        { path: '/subjects', label: 'Subjects', admin: true },
      ],
    },
    {
      name: 'Activities',
      items: [
        { path: '/sports', label: 'Sports', admin: true },
        { path: '/events', label: 'Events' },
      ],
    },
  ];

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
