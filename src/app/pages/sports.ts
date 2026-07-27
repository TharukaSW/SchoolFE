import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from '../core/api';
import { Sport, Teacher } from '../core/models';

@Component({
  selector: 'app-sports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <div><h1>Sports & Activities</h1><p>Adaptive sports and physical activities</p></div>
      <button class="btn btn-primary" (click)="openNew()">+ Add Sport</button>
    </div>

    <div *ngIf="loading()" class="spinner"></div>
    <div class="grid grid-3" *ngIf="!loading()">
      <div class="card card-pad" *ngFor="let s of sports()">
        <div class="row" style="justify-content:space-between">
          <h3>{{ s.name }}</h3>
          <span class="badge" [ngClass]="s.adaptive ? 'badge-success' : 'badge-soft'">{{ s.adaptive ? 'Adaptive' : 'Standard' }}</span>
        </div>
        <p class="muted" style="margin:8px 0">{{ s.description }}</p>
        <div class="cell-sub">Coach: {{ coachName(s.coach) }}</div>
        <div class="cell-sub">Schedule: {{ s.schedule || '—' }}</div>
        <div class="cell-sub">Location: {{ s.location || '—' }}</div>
        <div class="row mt-2" style="gap:6px">
          <button class="btn btn-outline btn-sm" (click)="edit(s)">Edit</button>
          <button class="btn btn-danger btn-sm" (click)="remove(s)">Delete</button>
        </div>
      </div>
      <div *ngIf="!sports().length" class="empty" style="grid-column:1/-1">No sports added yet.</div>
    </div>

    <div class="modal-backdrop" *ngIf="showModal()" (click)="close()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-head"><h3>{{ form._id ? 'Edit' : 'Add' }} Sport</h3><button class="btn btn-ghost" (click)="close()">✕</button></div>
        <div class="modal-body">
          <div *ngIf="error()" class="alert alert-error">{{ error() }}</div>
          <div class="form-grid">
            <div class="field"><label>Name *</label><input [(ngModel)]="form.name" /></div>
            <div class="field"><label>Coach</label>
              <input [(ngModel)]="form.coach" placeholder="e.g. Priya Patel" />
            </div>
            <div class="field"><label>Schedule</label><input [(ngModel)]="form.schedule" placeholder="e.g. Tue & Thu 10:00" /></div>
            <div class="field"><label>Location</label><input [(ngModel)]="form.location" /></div>
            <div class="field full"><label>Description</label><textarea [(ngModel)]="form.description"></textarea></div>
            <div class="field checkbox-row"><input type="checkbox" [(ngModel)]="form.adaptive" id="adaptive" /><label for="adaptive">Adapted for accessibility</label></div>
          </div>
        </div>
        <div class="modal-foot"><button class="btn btn-outline" (click)="close()">Cancel</button><button class="btn btn-primary" (click)="save()" [disabled]="saving()">{{ saving() ? 'Saving…' : 'Save' }}</button></div>
      </div>
    </div>
  `,
})
export class SportsPage {
  private api = inject(Api);
  sports = signal<Sport[]>([]);
  teachers = signal<Teacher[]>([]);
  loading = signal(true);
  showModal = signal(false);
  saving = signal(false);
  error = signal('');
  form: Partial<Sport> = {};

  constructor() { this.load(); this.api.teachers().subscribe((t) => this.teachers.set(t)); }
  load() { this.loading.set(true); this.api.sports().subscribe({ next: (s) => { this.sports.set(s); this.loading.set(false); }, error: () => this.loading.set(false) }); }
  coachName(c: any) {
    if (!c) return 'Unassigned';
    if (typeof c === 'object') return `${c.firstName} ${c.lastName}`;
    return c;
  }
  openNew() { this.form = { name: '', adaptive: true, coach: '' }; this.error.set(''); this.showModal.set(true); }
  edit(s: Sport) {
    this.form = {
      ...s,
      coach: typeof s.coach === 'object' ? `${(s.coach as any)?.firstName} ${(s.coach as any)?.lastName}` : s.coach || ''
    };
    this.error.set('');
    this.showModal.set(true);
  }
  close() { this.showModal.set(false); }
  save() {
    this.saving.set(true); this.error.set('');
    const req = this.form._id ? this.api.updateSport(this.form._id, this.form) : this.api.createSport(this.form);
    req.subscribe({ next: () => { this.saving.set(false); this.showModal.set(false); this.load(); }, error: (e) => { this.saving.set(false); this.error.set(e?.error?.message || 'Save failed'); } });
  }
  remove(s: Sport) { if (confirm(`Delete ${s.name}?`)) this.api.deleteSport(s._id!).subscribe(() => this.load()); }
}
