import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from '../core/api';
import { Auth } from '../core/auth';
import { SchoolEvent, Teacher } from '../core/models';
import { EVENT_PRIORITIES } from '../core/config';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <div><h1>Events</h1><p>School events, ordered by priority. Higher priority shown first.</p></div>
      <button *ngIf="isAdmin()" class="btn btn-primary" (click)="openNew()">+ Add Event</button>
    </div>

    <div class="toolbar">
      <select [(ngModel)]="prioFilter" style="max-width:200px">
        <option value="">All priorities</option>
        <option *ngFor="let p of priorities" [value]="p">{{ p }}</option>
      </select>
      <span class="spacer"></span>
      <span class="muted">Sorted by priority, then date</span>
    </div>

    <div *ngIf="loading()" class="spinner"></div>
    <div class="grid grid-2" *ngIf="!loading()">
      <div class="card card-pad" *ngFor="let e of filtered()" style="border-left:4px solid" [style.border-left-color]="prioColor(e.priority)">
        <div class="row" style="justify-content:space-between;align-items:flex-start">
          <div>
            <h3>{{ e.title }}</h3>
            <div class="cell-sub mt-1">{{ e.date | date: 'EEE, MMM d, y' }} · {{ e.location || '—' }}</div>
          </div>
          <span class="badge" [ngClass]="'prio-' + e.priority">{{ e.priority }}</span>
        </div>
        <p class="muted" style="margin:10px 0">{{ e.description }}</p>
        <div class="row" style="justify-content:space-between">
          <span class="badge badge-soft">{{ e.type }}</span>
          <div class="row" style="gap:6px" *ngIf="isAdmin()">
            <button class="btn btn-outline btn-sm" (click)="edit(e)">Edit</button>
            <button class="btn btn-danger btn-sm" (click)="remove(e)">Delete</button>
          </div>
        </div>
      </div>
      <div *ngIf="!filtered().length" class="empty" style="grid-column:1/-1">No events found.</div>
    </div>

    <div class="modal-backdrop" *ngIf="showModal()" (click)="close()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-head"><h3>{{ form._id ? 'Edit' : 'Add' }} Event</h3><button class="btn btn-ghost" (click)="close()">✕</button></div>
        <div class="modal-body">
          <div *ngIf="error()" class="alert alert-error">{{ error() }}</div>
          <div class="form-grid">
            <div class="field full"><label>Title *</label><input [(ngModel)]="form.title" /></div>
            <div class="field"><label>Date *</label><input type="date" [(ngModel)]="form.date" /></div>
            <div class="field"><label>Priority *</label>
              <select [(ngModel)]="form.priority"><option *ngFor="let p of priorities" [value]="p">{{ p }}</option></select>
            </div>
            <div class="field"><label>Type</label>
              <select [(ngModel)]="form.type"><option>Academic</option><option>Sports</option><option>Cultural</option><option>Therapy</option><option>Meeting</option><option>Holiday</option><option>Other</option></select>
            </div>
            <div class="field"><label>Location</label><input [(ngModel)]="form.location" /></div>
            <div class="field"><label>Organiser</label>
              <input [(ngModel)]="form.organizer" placeholder="e.g. Sarah Johnson" />
            </div>
            <div class="field full"><label>Description</label><textarea [(ngModel)]="form.description"></textarea></div>
          </div>
        </div>
        <div class="modal-foot"><button class="btn btn-outline" (click)="close()">Cancel</button><button class="btn btn-primary" (click)="save()" [disabled]="saving()">{{ saving() ? 'Saving…' : 'Save' }}</button></div>
      </div>
    </div>
  `,
})
export class EventsPage {
  private api = inject(Api);
  private auth = inject(Auth);
  isAdmin = this.auth.isAdmin;
  priorities = EVENT_PRIORITIES;

  events = signal<SchoolEvent[]>([]);
  teachers = signal<Teacher[]>([]);
  loading = signal(true);
  showModal = signal(false);
  saving = signal(false);
  error = signal('');
  prioFilter = '';
  form: Partial<SchoolEvent> = {};

  private rank: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };

  filtered = computed(() => {
    let list = this.events();
    if (this.prioFilter) list = list.filter((e) => e.priority === this.prioFilter);
    return [...list].sort((a, b) => this.rank[a.priority] - this.rank[b.priority] || new Date(a.date).getTime() - new Date(b.date).getTime());
  });

  constructor() { this.load(); this.api.teachers().subscribe((t) => this.teachers.set(t)); }
  load() { this.loading.set(true); this.api.events().subscribe({ next: (e) => { this.events.set(e); this.loading.set(false); }, error: () => this.loading.set(false) }); }
  prioColor(p: string) { return { Critical: '#dc2626', High: '#d97706', Medium: '#0ea5e9', Low: '#94a3b8' }[p] || '#94a3b8'; }
  openNew() { this.form = { title: '', priority: 'Medium', type: 'Other', date: new Date().toISOString().substring(0, 10), organizer: '' }; this.error.set(''); this.showModal.set(true); }
  edit(e: SchoolEvent) {
    this.form = {
      ...e,
      date: e.date ? e.date.substring(0, 10) : '',
      organizer: typeof e.organizer === 'object' ? `${(e.organizer as any)?.firstName} ${(e.organizer as any)?.lastName}` : e.organizer || ''
    };
    this.error.set('');
    this.showModal.set(true);
  }
  close() { this.showModal.set(false); }
  save() {
    this.saving.set(true); this.error.set('');
    const req = this.form._id ? this.api.updateEvent(this.form._id, this.form) : this.api.createEvent(this.form);
    req.subscribe({ next: () => { this.saving.set(false); this.showModal.set(false); this.load(); }, error: (e) => { this.saving.set(false); this.error.set(e?.error?.message || 'Save failed'); } });
  }
  remove(e: SchoolEvent) { if (confirm(`Delete "${e.title}"?`)) this.api.deleteEvent(e._id!).subscribe(() => this.load()); }
}
