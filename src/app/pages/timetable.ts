import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from '../core/api';
import { Auth } from '../core/auth';
import { TimetableSlot, Subject, Teacher } from '../core/models';
import { DAYS, GRADES } from '../core/config';

@Component({
  selector: 'app-timetable',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <div><h1>Timetable</h1><p>Weekly schedule per grade</p></div>
      <button *ngIf="isAdmin()" class="btn btn-primary" (click)="openNew()">+ Add Slot</button>
    </div>

    <div class="toolbar">
      <label class="row" style="gap:8px">Grade:
        <select [(ngModel)]="grade" (ngModelChange)="load()" style="max-width:240px">
          <option *ngFor="let g of grades" [ngValue]="g">{{ g }}</option>
        </select>
      </label>
    </div>

    <div *ngIf="loading()" class="spinner"></div>
    <div class="grid" [style.grid-template-columns]="'repeat(' + days.length + ', 1fr)'" *ngIf="!loading()">
      <div *ngFor="let day of days" class="card">
        <div class="card-head" style="padding:12px 14px"><h3>{{ day }}</h3></div>
        <div class="card-pad" style="padding:12px;display:flex;flex-direction:column;gap:8px">
          <div *ngFor="let slot of slotsFor(day)" class="tt-slot" [class.tt-break]="!slot.subject">
            <div class="time">{{ slot.startTime }}–{{ slot.endTime }}</div>
            <div class="subj">{{ subjectName(slot) }}</div>
            <div class="cell-sub">{{ teacherName(slot.teacher) }}</div>
            <div class="cell-sub" *ngIf="slot.room">{{ slot.room }}</div>
            <div class="row mt-1" style="gap:4px" *ngIf="isAdmin()">
              <button class="btn btn-ghost btn-sm" (click)="edit(slot)">✎</button>
              <button class="btn btn-ghost btn-sm" (click)="remove(slot)">✕</button>
            </div>
          </div>
          <p *ngIf="!slotsFor(day).length" class="muted center" style="font-size:12px">No classes</p>
        </div>
      </div>
    </div>

    <div class="modal-backdrop" *ngIf="showModal()" (click)="close()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-head"><h3>{{ form._id ? 'Edit' : 'Add' }} Timetable Slot</h3><button class="btn btn-ghost" (click)="close()">✕</button></div>
        <div class="modal-body">
          <div *ngIf="error()" class="alert alert-error">{{ error() }}</div>
          <div class="form-grid">
            <div class="field"><label>Grade *</label>
              <select [(ngModel)]="form.grade"><option *ngFor="let g of grades" [ngValue]="g">{{ g }}</option></select>
            </div>
            <div class="field"><label>Day *</label>
              <select [(ngModel)]="form.day"><option *ngFor="let d of days" [value]="d">{{ d }}</option></select>
            </div>
            <div class="field"><label>Start time *</label><input type="time" [(ngModel)]="form.startTime" /></div>
            <div class="field"><label>End time *</label><input type="time" [(ngModel)]="form.endTime" /></div>
            <div class="field"><label>Subject</label>
              <select [(ngModel)]="form.subject"><option [ngValue]="null">— None (activity) —</option><option *ngFor="let s of subjects()" [ngValue]="s._id">{{ s.name }}</option></select>
            </div>
            <div class="field"><label>Activity label <span class="hint">(if no subject)</span></label><input [(ngModel)]="form.activity" placeholder="e.g. Sensory Break" /></div>
            <div class="field"><label>Teacher</label>
              <select [(ngModel)]="form.teacher"><option [ngValue]="null">— None —</option><option *ngFor="let t of teachers()" [ngValue]="t._id">{{ t.firstName }} {{ t.lastName }}</option></select>
            </div>
            <div class="field"><label>Room</label><input [(ngModel)]="form.room" /></div>
          </div>
        </div>
        <div class="modal-foot"><button class="btn btn-outline" (click)="close()">Cancel</button><button class="btn btn-primary" (click)="save()" [disabled]="saving()">{{ saving() ? 'Saving…' : 'Save' }}</button></div>
      </div>
    </div>
  `,
})
export class TimetablePage {
  private api = inject(Api);
  private auth = inject(Auth);
  isAdmin = this.auth.isAdmin;
  grades = GRADES;
  days = DAYS;

  grade = GRADES[0];
  slots = signal<TimetableSlot[]>([]);
  subjects = signal<Subject[]>([]);
  teachers = signal<Teacher[]>([]);
  loading = signal(true);
  showModal = signal(false);
  saving = signal(false);
  error = signal('');
  form: Partial<TimetableSlot> = {};

  constructor() {
    this.load();
    this.api.subjects().subscribe((s) => this.subjects.set(s));
    this.api.teachers().subscribe((t) => this.teachers.set(t));
  }

  load() {
    this.loading.set(true);
    this.api.timetable({ grade: this.grade }).subscribe({
      next: (s) => { this.slots.set(s); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  slotsFor(day: string) {
    return this.slots().filter((s) => s.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }
  subjectName(slot: TimetableSlot) {
    if (slot.subject && typeof slot.subject === 'object') return (slot.subject as Subject).name;
    return slot.activity || 'Free';
  }
  teacherName(t: any) { return t && typeof t === 'object' ? `${t.firstName} ${t.lastName}` : ''; }

  openNew() { this.form = { grade: this.grade, day: DAYS[0], startTime: '09:00', endTime: '09:45', subject: null, teacher: null }; this.error.set(''); this.showModal.set(true); }
  edit(s: TimetableSlot) {
    this.form = { ...s, subject: typeof s.subject === 'object' ? (s.subject as any)?._id : s.subject, teacher: typeof s.teacher === 'object' ? (s.teacher as any)?._id : s.teacher };
    this.error.set(''); this.showModal.set(true);
  }
  close() { this.showModal.set(false); }
  save() {
    this.saving.set(true); this.error.set('');
    const req = this.form._id ? this.api.updateSlot(this.form._id, this.form) : this.api.createSlot(this.form);
    req.subscribe({ next: () => { this.saving.set(false); this.showModal.set(false); this.load(); }, error: (e) => { this.saving.set(false); this.error.set(e?.error?.message || 'Save failed'); } });
  }
  remove(s: TimetableSlot) { if (confirm('Delete this slot?')) this.api.deleteSlot(s._id!).subscribe(() => this.load()); }
}
