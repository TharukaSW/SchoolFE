import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from '../core/api';
import { Subject } from '../core/models';
import { CATEGORIES, LEVELS } from '../core/config';

@Component({
  selector: 'app-subjects',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <div><h1>Subjects</h1><p>Curriculum subjects and their maximum scores</p></div>
      <button class="btn btn-primary" (click)="openNew()">+ Add Subject</button>
    </div>

    <div class="card">
      <div *ngIf="loading()" class="spinner"></div>
      <div class="table-wrap" *ngIf="!loading()">
        <table class="table">
          <thead><tr><th>Code</th><th>Subject</th><th>Level</th><th>Max Score</th><th>Categories</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let s of subjects()">
              <td><span class="badge badge-primary">{{ s.code }}</span></td>
              <td><div class="cell-strong">{{ s.name }}</div><div class="cell-sub">{{ s.description }}</div></td>
              <td><span class="badge">{{ s.level || 'Primary' }}</span></td>
              <td>{{ s.maxScore }}</td>
              <td>{{ s.categories.length ? s.categories.join(', ') : 'All' }}</td>
              <td class="actions">
                <button class="btn btn-outline btn-sm" (click)="edit(s)">Edit</button>
                <button class="btn btn-danger btn-sm" (click)="remove(s)">Delete</button>
              </td>
            </tr>
            <tr *ngIf="!subjects().length"><td colspan="5"><div class="empty">No subjects yet.</div></td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="modal-backdrop" *ngIf="showModal()" (click)="close()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-head"><h3>{{ form._id ? 'Edit' : 'Add' }} Subject</h3><button class="btn btn-ghost" (click)="close()">✕</button></div>
        <div class="modal-body">
          <div *ngIf="error()" class="alert alert-error">{{ error() }}</div>
          <div class="form-grid">
            <div class="field"><label>Name *</label><input [(ngModel)]="form.name" /></div>
            <div class="field"><label>Code *</label><input [(ngModel)]="form.code" /></div>
            <div class="field"><label>Level *</label>
              <select [(ngModel)]="form.level">
                <option *ngFor="let l of levels" [value]="l">{{ l }}</option>
              </select>
            </div>
            <div class="field"><label>Max score *</label><input type="number" [(ngModel)]="form.maxScore" /></div>
            <div class="field full"><label>Description</label><input [(ngModel)]="form.description" /></div>
            <div class="field full"><label>Applies to categories <span class="hint">(none = all)</span></label>
              <div class="row wrap">
                <label *ngFor="let c of categories" class="checkbox-row" style="border:1px solid var(--border-strong);padding:6px 10px;border-radius:8px">
                  <input type="checkbox" [checked]="form.categories?.includes(c)" (change)="toggle(c)" /> {{ c }}
                </label>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-foot"><button class="btn btn-outline" (click)="close()">Cancel</button><button class="btn btn-primary" (click)="save()" [disabled]="saving()">{{ saving() ? 'Saving…' : 'Save' }}</button></div>
      </div>
    </div>
  `,
})
export class SubjectsPage {
  private api = inject(Api);
  categories = CATEGORIES;
  levels = LEVELS;
  subjects = signal<Subject[]>([]);
  loading = signal(true);
  showModal = signal(false);
  saving = signal(false);
  error = signal('');
  form: Partial<Subject> = {};

  constructor() { this.load(); }
  load() {
    this.loading.set(true);
    this.api.subjects().subscribe({ next: (s) => { this.subjects.set(s); this.loading.set(false); }, error: () => this.loading.set(false) });
  }
  openNew() { this.form = { name: '', code: '', level: 'Primary', maxScore: 100, categories: [] }; this.error.set(''); this.showModal.set(true); }
  edit(s: Subject) { this.form = { ...s, level: s.level || 'Primary', categories: [...(s.categories || [])] }; this.error.set(''); this.showModal.set(true); }
  close() { this.showModal.set(false); }
  toggle(c: string) {
    const arr = this.form.categories || [];
    this.form.categories = arr.includes(c) ? arr.filter((x) => x !== c) : [...arr, c];
  }
  save() {
    this.saving.set(true); this.error.set('');
    const req = this.form._id ? this.api.updateSubject(this.form._id, this.form) : this.api.createSubject(this.form);
    req.subscribe({ next: () => { this.saving.set(false); this.showModal.set(false); this.load(); }, error: (e) => { this.saving.set(false); this.error.set(e?.error?.message || 'Save failed'); } });
  }
  remove(s: Subject) { if (confirm(`Delete ${s.name}?`)) this.api.deleteSubject(s._id!).subscribe(() => this.load()); }
}
