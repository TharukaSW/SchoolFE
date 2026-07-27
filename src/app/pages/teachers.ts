import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from '../core/api';
import { Auth } from '../core/auth';
import { Teacher, Subject } from '../core/models';
import { CATEGORIES, catKey, SPECIALIZATIONS } from '../core/config';

@Component({
  selector: 'app-teachers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <div><h1>Teachers</h1><p>Manage teaching staff and their specialisations</p></div>
      <button *ngIf="isAdmin()" class="btn btn-primary" (click)="openNew()">+ Add Teacher</button>
    </div>

    <div class="toolbar">
      <input class="search" placeholder="Search name, email, ID…" [(ngModel)]="search" (ngModelChange)="load()" />
      <span class="muted">{{ teachers().length }} teacher(s)</span>
    </div>

    <div class="card">
      <div *ngIf="loading()" class="spinner"></div>
      <div class="table-wrap" *ngIf="!loading()">
        <table class="table">
          <thead>
            <tr><th>Employee</th><th>Contact</th><th>Specialisations</th><th>Subjects</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let t of teachers()">
              <td>
                <div class="cell-strong">{{ t.firstName }} {{ t.lastName }}</div>
                <div class="cell-sub">{{ t.employeeId }} · {{ teacherSummary(t) }}</div>
              </td>
              <td><div>{{ t.email }}</div><div class="cell-sub">{{ t.phone || '—' }}</div></td>
              <td>
                <span *ngFor="let s of t.specializations" class="badge cat-{{ shortCat(s) }}" style="margin:2px">{{ s }}</span>
              </td>
              <td>{{ subjectNames(t) }}</td>
              <td><span class="badge" [ngClass]="t.status === 'Active' ? 'badge-success' : 'badge-soft'">{{ t.status }}</span></td>
              <td class="actions">
                <button *ngIf="isAdmin()" class="btn btn-outline btn-sm" (click)="edit(t)">Edit</button>
                <button *ngIf="isAdmin()" class="btn btn-danger btn-sm" (click)="remove(t)">Delete</button>
              </td>
            </tr>
            <tr *ngIf="!teachers().length"><td colspan="6"><div class="empty">No teachers found.</div></td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal -->
    <div class="modal-backdrop" *ngIf="showModal()" (click)="close()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-head"><h3>{{ form._id ? 'Edit' : 'Add' }} Teacher</h3><button class="btn btn-ghost" (click)="close()">✕</button></div>
        <div class="modal-body">
          <div *ngIf="error()" class="alert alert-error">{{ error() }}</div>
          <div class="form-grid">
            <div class="field"><label>Employee ID *</label><input [(ngModel)]="form.employeeId" /></div>
            <div class="field"><label>Status</label>
              <select [(ngModel)]="form.status"><option>Active</option><option>On Leave</option><option>Inactive</option></select>
            </div>
            <div class="field"><label>First name *</label><input [(ngModel)]="form.firstName" /></div>
            <div class="field"><label>Last name *</label><input [(ngModel)]="form.lastName" /></div>
            <div class="field"><label>Email *</label><input type="email" [(ngModel)]="form.email" /></div>
            <div class="field"><label>Phone</label><input [(ngModel)]="form.phone" /></div>
            <div class="field"><label>Gender</label>
              <select [(ngModel)]="form.gender"><option>Female</option><option>Male</option><option>Other</option></select>
            </div>
            <div class="field"><label>Designation</label>
              <div class="row wrap">
                <label class="checkbox-row" style="border:1px solid var(--border-strong);padding:6px 10px;border-radius:8px">
                  <input type="checkbox" [checked]="form.designation === 'Principal'" (change)="toggleDesignation('Principal')" /> Principal
                </label>
                <label class="checkbox-row" style="border:1px solid var(--border-strong);padding:6px 10px;border-radius:8px">
                  <input type="checkbox" [checked]="form.designation === 'Teacher'" (change)="toggleDesignation('Teacher')" /> Teacher
                </label>
              </div>
            </div>
            <div class="field"><label>Designation Grade</label>
              <input [(ngModel)]="form.designationGrade" placeholder="e.g. Grade 1" />
            </div>
            <div class="field"><label>NIC</label>
              <input [(ngModel)]="form.nic" placeholder="National Identity Card Number" />
            </div>
            <div class="field"><label>Date of Birth (Birthday)</label>
              <input type="date" [(ngModel)]="form.dob" />
            </div>
            <div class="field"><label>Appointment Date</label>
              <input type="date" [(ngModel)]="form.appointmentDate" />
            </div>
            <div class="field"><label>Pension Date</label>
              <input type="date" [(ngModel)]="form.pensionDate" />
            </div>
            <div class="field full"><label>Address</label>
              <input [(ngModel)]="form.address" placeholder="Residential Address" />
            </div>
            <div class="field"><label>Guardian Name</label>
              <input [(ngModel)]="form.guardianName" placeholder="Guardian's Name" />
            </div>
            <div class="field"><label>Guardian Telephone</label>
              <input [(ngModel)]="form.guardianPhone" placeholder="Guardian's Telephone Number" />
            </div>
            <div class="field full"><label>Educational qualifications</label><textarea [(ngModel)]="form.educationalQualifications" rows="2"></textarea></div>
            <div class="field full"><label>Professional qualification</label><textarea [(ngModel)]="form.professionalQualification" rows="2"></textarea></div>
            <div class="field full"><label>Other skills</label><textarea [(ngModel)]="form.otherSkills" rows="2"></textarea></div>
            <div class="field full"><label>Specialisations</label>
              <div class="row wrap">
                <label *ngFor="let c of specs" class="checkbox-row" style="border:1px solid var(--border-strong);padding:6px 10px;border-radius:8px">
                  <input type="checkbox" [checked]="form.specializations?.includes(c)" (change)="toggleSpec(c)" /> {{ c }}
                </label>
              </div>
            </div>
            <div class="field full"><label>Subjects</label>
              <div class="row wrap">
                <label *ngFor="let s of subjects()" class="checkbox-row" style="border:1px solid var(--border-strong);padding:6px 10px;border-radius:8px">
                  <input type="checkbox" [checked]="form.subjects?.includes(s._id!)" (change)="toggleSubject(s._id!)" /> {{ s.name }}
                </label>
              </div>
            </div>
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
export class TeachersPage {
  private api = inject(Api);
  private auth = inject(Auth);
  isAdmin = this.auth.isAdmin;
  categories = CATEGORIES;
  specs = SPECIALIZATIONS;
 
  teachers = signal<Teacher[]>([]);
  subjects = signal<Subject[]>([]);
  loading = signal(true);
  showModal = signal(false);
  saving = signal(false);
  error = signal('');
  search = '';
  form: Partial<Teacher> = this.blank();
 
  constructor() {
    this.load();
    this.api.subjects().subscribe((s) => this.subjects.set(s));
  }
 
  blank(): Partial<Teacher> {
    return {
      employeeId: '',
      firstName: '',
      lastName: '',
      email: '',
      status: 'Active',
      gender: 'Female',
      designation: 'Teacher',
      designationGrade: '',
      specializations: [],
      subjects: [],
      appointmentDate: '',
      dob: '',
      address: '',
      guardianName: '',
      guardianPhone: '',
      pensionDate: '',
      nic: '',
    };
  }

  load() {
    this.loading.set(true);
    this.api.teachers({ search: this.search }).subscribe({
      next: (t) => { this.teachers.set(t); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  shortCat = catKey;
  subjectNames(t: Teacher) {
    const subs = (t.subjects || []) as any[];
    return subs.map((s) => (typeof s === 'object' ? s.name : '')).filter(Boolean).join(', ') || '—';
  }

  openNew() { this.form = this.blank(); this.error.set(''); this.showModal.set(true); }
  edit(t: Teacher) {
    this.form = {
      ...t,
      designation: t.designation || 'Teacher',
      designationGrade: t.designationGrade || '',
      educationalQualifications: t.educationalQualifications || '',
      professionalQualification: t.professionalQualification || '',
      otherSkills: t.otherSkills || '',
      subjects: ((t.subjects || []) as any[]).map((s) => (typeof s === 'object' ? s._id : s)),
      appointmentDate: t.appointmentDate ? this.datePart(t.appointmentDate) : '',
      dob: t.dob ? this.datePart(t.dob) : '',
      address: t.address || '',
      guardianName: t.guardianName || '',
      guardianPhone: t.guardianPhone || '',
      pensionDate: t.pensionDate ? this.datePart(t.pensionDate) : '',
      nic: t.nic || '',
    };
    this.error.set('');
    this.showModal.set(true);
  }

  datePart(value?: string) {
    return value ? value.slice(0, 10) : '';
  }
  close() { this.showModal.set(false); }
 
  toggleSpec(c: string) {
    const arr = this.form.specializations || [];
    this.form.specializations = arr.includes(c) ? arr.filter((x) => x !== c) : [...arr, c];
  }
  toggleSubject(id: string) {
    const arr = (this.form.subjects || []) as string[];
    this.form.subjects = arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
  }
  toggleDesignation(value: 'Principal' | 'Teacher') {
    this.form.designation = this.form.designation === value ? 'Teacher' : value;
  }
 
  teacherSummary(t: Teacher) {
    const des = t.designationGrade ? `${t.designation || 'Teacher'} (${t.designationGrade})` : (t.designation || 'Teacher');
    return [des, t.educationalQualifications, t.professionalQualification]
      .filter(Boolean)
      .join(' · ') || '—';
  }

  save() {
    this.saving.set(true);
    this.error.set('');
    const body = {
      ...this.form,
      designation: this.form.designation || 'Teacher',
      educationalQualifications: this.form.educationalQualifications || '',
    };
    if (!body.appointmentDate) delete body.appointmentDate;
    if (!body.dob) delete body.dob;
    if (!body.pensionDate) delete body.pensionDate;
    
    const req = this.form._id
      ? this.api.updateTeacher(this.form._id, body)
      : this.api.createTeacher(body);
    req.subscribe({
      next: () => { this.saving.set(false); this.showModal.set(false); this.load(); },
      error: (e) => { this.saving.set(false); this.error.set(e?.error?.message || 'Save failed'); },
    });
  }

  remove(t: Teacher) {
    if (!confirm(`Delete ${t.firstName} ${t.lastName}?`)) return;
    this.api.deleteTeacher(t._id!).subscribe(() => this.load());
  }
}
