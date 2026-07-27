import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Api } from '../core/api';
import { DashboardData } from '../core/models';
import { catKey } from '../core/config';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-header">
      <div><h1>Dashboard</h1><p>Overview of Sandagala Special School</p></div>
    </div>

    <div *ngIf="loading()" class="spinner"></div>

    <ng-container *ngIf="data() as d">
      <div class="grid grid-4 mb-2">
        <div class="stat">
          <div><div class="stat-val">{{ d.counts.students }}</div><div class="stat-label">Active Students</div></div>
        </div>
        <div class="stat">
          <div><div class="stat-val">{{ d.counts.teachers }}</div><div class="stat-label">Teachers</div></div>
        </div>
        <div class="stat">
          <div><div class="stat-val">{{ d.counts.subjects }}</div><div class="stat-label">Subjects</div></div>
        </div>
        <div class="stat">
          <div><div class="stat-val">{{ d.upcomingEvents.length }}</div><div class="stat-label">Upcoming Events</div></div>
        </div>
      </div>

      <div class="grid grid-2">
        <div class="card">
          <div class="card-head"><h3>Students by Category</h3></div>
          <div class="card-pad">
            <div *ngFor="let c of d.byCategory" style="margin-bottom:16px">
              <div class="row" style="justify-content:space-between;margin-bottom:6px">
                <span class="badge" [ngClass]="'cat-' + key(c.category)">{{ c.category }}</span>
                <strong>{{ c.count }}</strong>
              </div>
              <div class="progress">
                <span [style.width.%]="pct(c.count, d.counts.students)"></span>
              </div>
            </div>
            <p *ngIf="!d.byCategory.length" class="muted">No students yet.</p>
          </div>
        </div>

        <div class="card">
          <div class="card-head">
            <h3>Upcoming Events</h3>
            <a routerLink="/events" class="btn btn-ghost btn-sm">View all</a>
          </div>
          <div class="card-pad">
            <div *ngFor="let e of d.upcomingEvents" class="row" style="justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)">
              <div>
                <div class="cell-strong">{{ e.title }}</div>
                <div class="cell-sub">{{ e.date | date: 'EEE, MMM d' }} · {{ e.location || '—' }}</div>
              </div>
              <span class="badge" [ngClass]="'prio-' + e.priority">{{ e.priority }}</span>
            </div>
            <div *ngIf="!d.upcomingEvents.length" class="empty">
              No upcoming events.
            </div>
          </div>
        </div>
      </div>

      <div class="card mt-2">
        <div class="card-head">
          <h3>Today's Birthday Celebrations</h3>
          <span class="badge badge-soft">{{ birthdayCount(d) }} today</span>
        </div>
        <div class="card-pad">
          <div class="grid grid-2">
            <div>
              <div class="row" style="justify-content:space-between;margin-bottom:10px">
                <strong>Teachers</strong>
                <span class="muted">{{ d.birthdays.teachers.length }}</span>
              </div>
              <div *ngFor="let t of d.birthdays.teachers" class="row" style="justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)">
                <div>
                  <div class="cell-strong">{{ t.name }}</div>
                  <div class="cell-sub">{{ t.employeeId }} · {{ t.designation }}</div>
                </div>
                <span class="chip clr-Green"><span class="swatch"></span>Birthday</span>
              </div>
              <p *ngIf="!d.birthdays.teachers.length" class="muted">No teacher birthdays today.</p>
            </div>

            <div>
              <div class="row" style="justify-content:space-between;margin-bottom:10px">
                <strong>Students</strong>
                <span class="muted">{{ d.birthdays.students.length }}</span>
              </div>
              <div *ngFor="let s of d.birthdays.students" class="row" style="justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)">
                <div>
                  <div class="cell-strong">{{ s.name }}</div>
                  <div class="cell-sub">{{ s.admissionNumber }} · {{ s.category }}</div>
                </div>
                <span class="chip clr-Yellow"><span class="swatch"></span>Birthday</span>
              </div>
              <p *ngIf="!d.birthdays.students.length" class="muted">No student birthdays today.</p>
            </div>
          </div>
        </div>
      </div>
    </ng-container>
  `,
})
export class DashboardPage {
  private api = inject(Api);
  data = signal<DashboardData | null>(null);
  loading = signal(true);
  key = catKey;

  constructor() {
    this.api.dashboard().subscribe({
      next: (d) => { this.data.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  pct(n: number, total: number) { return total ? Math.round((n / total) * 100) : 0; }
  birthdayCount(d: DashboardData) { return d.birthdays.students.length + d.birthdays.teachers.length; }
}
