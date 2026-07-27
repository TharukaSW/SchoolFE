import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Api } from '../core/api';
import { Auth } from '../core/auth';
import { Student } from '../core/models';
import { CATEGORIES, GRADES, catKey } from '../core/config';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-header">
      <div><h1>Students</h1><p>Enrolment records across all three special-needs categories</p></div>
      <button class="btn btn-primary" (click)="openNew()">+ Add Student</button>
    </div>

    <div class="toolbar">
      <input class="search" placeholder="Search name or admission no…" [(ngModel)]="search" (ngModelChange)="load()" />
      <select [(ngModel)]="categoryFilter" (ngModelChange)="load()" style="max-width:220px">
        <option value="">All categories</option>
        <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
      </select>
      <select [(ngModel)]="gradeFilter" (ngModelChange)="load()" style="max-width:160px">
        <option value="">All grades</option>
        <option *ngFor="let g of grades" [ngValue]="g">Grade {{ g }}</option>
      </select>
      <span class="spacer"></span>
      <span class="muted">{{ students().length }} student(s)</span>
    </div>

    <div class="card">
      <div *ngIf="loading()" class="spinner"></div>
      <div class="table-wrap" *ngIf="!loading()">
        <table class="table">
          <thead>
            <tr><th>Student</th><th>Category</th><th>Residence</th><th>Guardian</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let s of students()">
              <td>
                <a [routerLink]="['/students', s._id]" class="cell-strong">{{ displayName(s) }}</a>
                <div class="cell-sub">{{ s.nameWithInitials || '—' }} · {{ s.admissionNumber }} · {{ s.gender }} · Age {{ age(s.dob) }} · Grade {{ s.grade || '—' }}</div>
                        <td>
                <div class="row wrap" style="gap:4px">
                  <span *ngFor="let cat of getCategories(s)" class="badge cat-{{ key(cat) }}">{{ cat }}</span>
                  <span *ngIf="!getCategories(s).length" class="muted">—</span>
                </div>
              </td>
              <td><span class="badge" [ngClass]="s.residence === 'Home' ? 'badge-success' : (s.residence === 'Hostel' ? 'badge-warning' : 'badge-soft')">{{ s.residence || '—' }}</span></td>
              <td><div>{{ s.guardian?.name || '—' }}</div><div class="cell-sub">{{ s.guardian?.phone || '' }}</div></td>
              <td><span class="badge" [ngClass]="s.status === 'Active' ? 'badge-success' : 'badge-soft'">{{ s.status }}</span></td>
              <td class="actions">
                <a [routerLink]="['/students', s._id]" class="btn btn-outline btn-sm">Open</a>
                <button class="btn btn-outline btn-sm" (click)="edit(s)">Edit</button>
                <button *ngIf="isAdmin()" class="btn btn-danger btn-sm" (click)="remove(s)">Delete</button>
              </td>
            </tr>
            <tr *ngIf="!students().length"><td colspan="6"><div class="empty">No students found.</div></td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="modal-backdrop" *ngIf="showModal()" (click)="close()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-head"><h3>{{ form._id ? 'Edit' : 'Add' }} Student</h3><button class="btn btn-ghost" (click)="close()">✕</button></div>
        <div class="modal-body">
          <div *ngIf="error()" class="alert alert-error">{{ error() }}</div>
          <div class="form-grid">
            <div class="field"><label>Admission No. *</label><input [(ngModel)]="form.admissionNumber" /></div>
            <div class="field"><label>Name with initials *</label><input [(ngModel)]="form.nameWithInitials" /></div>
            <div class="field"><label>Full name *</label><input [(ngModel)]="form.fullName" /></div>
            <div class="field full">
              <label style="font-weight:600">Categories * (Select one or more)</label>
              <div class="category-checkboxes" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; margin-top: 6px; padding: 12px; background: var(--bg-soft, #f8fafc); border: 1px solid var(--border, #e2e8f0); border-radius: 8px;">
                <label *ngFor="let c of categories" style="display: flex; align-items: center; gap: 8px; font-weight: normal; cursor: pointer; user-select: none;">
                  <input type="checkbox" [checked]="isCategorySelected(c)" (change)="toggleCategory(c)" style="width: 16px; height: 16px; cursor: pointer;" />
                  <span class="badge cat-{{ key(c) }}">{{ c }}</span>
                </label>
              </div>
            </div>
            <div class="field"><label>Class grade *</label>
              <select [(ngModel)]="form.grade"><option value="" disabled>Select…</option><option *ngFor="let g of grades" [ngValue]="g">{{ g }}</option></select>
            </div>
            <div class="field"><label>Residence *</label>
              <select [(ngModel)]="form.residence"><option value="" disabled>Select…</option><option value="Hostel">Hostel</option><option value="Home">Home</option></select>
            </div>
            <div class="field"><label>Entered date from school</label><input type="date" [(ngModel)]="form.enteredDate" /></div>
            <div class="field"><label>Exit date from school</label><input type="date" [(ngModel)]="form.exitDate" /></div>
            <div class="field full"><label>Assistance allowances</label><input [(ngModel)]="form.assistanceAllowances" /></div>
            <div class="field"><label>Grama Niladari division</label><input [(ngModel)]="form.gramaNiladariDivision" /></div>
            <div class="field"><label>Division no.</label><input [(ngModel)]="form.divisionNo" /></div>
            <div class="field"><label>Divisional secretary office</label><input [(ngModel)]="form.divisionalSecretaryOffice" /></div>
            <div class="field"><label>Health medical officer division</label><input [(ngModel)]="form.healthMedicalOfficerDivision" /></div>
            <div class="field"><label>Date of birth</label><input type="date" [(ngModel)]="form.dob" /></div>
            <div class="field"><label>Gender</label>
              <select [(ngModel)]="form.gender"><option>Male</option><option>Female</option><option>Other</option></select>
            </div>
            <div class="field"><label>Status</label>
              <select [(ngModel)]="form.status"><option>Active</option><option>Graduated</option><option>Inactive</option></select>
            </div>
            <div class="field full"><label>Address</label><input [(ngModel)]="form.address" /></div>
            <div class="field"><label>Guardian name</label><input [(ngModel)]="guardian.name" /></div>
            <div class="field"><label>Guardian phone</label><input [(ngModel)]="guardian.phone" /></div>
            <div class="field"><label>Guardian relation</label><input [(ngModel)]="guardian.relation" /></div>
            <div class="field"><label>Guardian email</label><input [(ngModel)]="guardian.email" /></div>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn btn-outline" (click)="close()">Cancel</button>
          <button class="btn btn-primary" (click)="save()" [disabled]="saving()">{{ saving() ? 'Saving…' : 'Save' }}</button>
        </div>
      </div>
    </div>
  `,
})
export class StudentsPage {
  private api = inject(Api);
  private auth = inject(Auth);
  isAdmin = this.auth.isAdmin;
  categories = CATEGORIES;
  grades = GRADES;
  key = catKey;

  students = signal<Student[]>([]);
  loading = signal(true);
  showModal = signal(false);
  saving = signal(false);
  error = signal('');
  search = '';
  categoryFilter = '';
  gradeFilter: string = '';
  form: Partial<Student> & { categories?: string[] } = {};
  guardian: any = {};

  constructor() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.api.students({ search: this.search, category: this.categoryFilter, grade: this.gradeFilter }).subscribe({
      next: (s) => { this.students.set(s); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  getCategories(s: Partial<Student>): string[] {
    if (s.categories && s.categories.length) {
      return s.categories;
    }
    if (s.category) {
      return s.category.split(',').map((x) => x.trim()).filter(Boolean);
    }
    return [];
  }

  isCategorySelected(c: string): boolean {
    return Array.isArray(this.form.categories) && this.form.categories.includes(c);
  }

  toggleCategory(c: string): void {
    if (!Array.isArray(this.form.categories)) {
      this.form.categories = [];
    }
    const idx = this.form.categories.indexOf(c);
    if (idx > -1) {
      this.form.categories.splice(idx, 1);
    } else {
      this.form.categories.push(c);
    }
  }

  age(dob?: string) {
    if (!dob) return '—';
    const d = new Date(dob);
    return Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000));
  }

  openNew() {
    this.form = {
      admissionNumber: '',
      nameWithInitials: '',
      fullName: '',
      categories: [],
      category: '',
      grade: '1-A',
      residence: 'Home',
      gender: 'Male',
      status: 'Active',
      enteredDate: new Date().toISOString().slice(0, 10),
    };
    this.guardian = {};
    this.error.set('');
    this.showModal.set(true);
  }

  edit(s: Student) {
    const cats = this.getCategories(s);
    this.form = {
      ...s,
      categories: [...cats],
      category: cats.join(', '),
      nameWithInitials: s.nameWithInitials || this.buildInitials(s),
      fullName: s.fullName || this.displayName(s),
      grade: s.grade ?? '1-A',
      residence: s.residence || 'Home',
      dob: this.datePart(s.dob),
      enteredDate: this.datePart(s.enteredDate || s.enrollmentDate),
      exitDate: this.datePart(s.exitDate),
    };
    this.guardian = { ...(s.guardian || {}) };
    this.error.set('');
    this.showModal.set(true);
  }

  close() { this.showModal.set(false); }

  save() {
    if (!this.form.categories || this.form.categories.length === 0) {
      this.error.set('Please select at least one category.');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    const categories = this.form.categories;
    const category = categories.join(', ');
    const enteredDate = this.form.enteredDate || this.form.enrollmentDate;
    const body = {
      ...this.form,
      categories,
      category,
      enteredDate,
      enrollmentDate: enteredDate,
      guardian: this.guardian,
    };
    const req = this.form._id ? this.api.updateStudent(this.form._id, body) : this.api.createStudent(body);
    req.subscribe({
      next: () => { this.saving.set(false); this.showModal.set(false); this.load(); },
      error: (e) => { this.saving.set(false); this.error.set(e?.error?.message || 'Save failed'); },
    });
  }

  remove(s: Student) {
    if (!confirm(`Delete ${this.displayName(s)}? This removes their record.`)) return;
    this.api.deleteStudent(s._id!).subscribe(() => this.load());
  }

  displayName(s: Partial<Student>) {
    return s.fullName || s.nameWithInitials || [s.firstName, s.lastName].filter(Boolean).join(' ').trim() || '—';
  }

  buildInitials(s: Partial<Student>) {
    const source = this.displayName(s);
    return source === '—' ? '' : source.split(/\s+/).map((part) => part[0]).join('').toUpperCase();
  }

  datePart(value?: string) {
    return value ? value.slice(0, 10) : undefined;
  }
}
