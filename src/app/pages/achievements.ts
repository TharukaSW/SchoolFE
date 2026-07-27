import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from '../core/api';
import { Student, Achievement } from '../core/models';

@Component({
  selector: 'app-achievements',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <div>
        <h1>Student Achievements</h1>
        <p>Record and celebrate academic, therapeutic, athletic, and behavioral achievements of our students.</p>
      </div>
    </div>

    <div class="grid grid-2">
      <!-- Selector and Current Achievements -->
      <div class="card card-pad">
        <div class="field" style="margin-bottom:20px">
          <label>Select Student *</label>
          <select [(ngModel)]="selectedStudentId" (ngModelChange)="onStudentSelect($event)">
            <option value="" disabled>-- Select a student --</option>
            <option *ngFor="let s of students()" [value]="s._id">
              {{ s.firstName }} {{ s.lastName }} · {{ s.admissionNumber }}
            </option>
          </select>
        </div>

        <div *ngIf="selectedStudent() as s">
          <div class="row" style="justify-content:space-between;margin-bottom:12px;border-bottom:1px solid var(--border);padding-bottom:10px">
            <h3>Achievements for {{ s.firstName }} {{ s.lastName }}</h3>
            <span class="badge badge-primary">{{ s.admissionNumber }}</span>
          </div>

          <div *ngIf="loadingAchievements()" class="spinner" style="margin:20px auto"></div>

          <div *ngIf="!loadingAchievements()">
            <div *ngFor="let a of achievements()" class="achievement-item">
              <div class="row" style="justify-content:space-between;align-items:flex-start">
                <div>
                  <div class="cell-strong" style="font-size:15px;color:var(--text)">{{ a.title }}</div>
                  <div class="cell-sub" style="margin-top:2px">{{ a.date | date: 'longDate' }}</div>
                </div>
                <button class="btn btn-danger btn-sm" (click)="deleteAchievement(a._id!)">Delete</button>
              </div>
              <p class="muted" style="margin:8px 0 0;font-size:13.5px">{{ a.description || 'No description provided.' }}</p>
            </div>

            <div *ngIf="!achievements().length" class="empty" style="padding:40px 20px">
              No achievements logged yet for this student. Use the form next door to add one!
            </div>
          </div>
        </div>

        <div *ngIf="!selectedStudentId" class="empty" style="padding:80px 20px">
          Please select a student to view and add achievements.
        </div>
      </div>

      <!-- Add Achievement Form -->
      <div class="card card-pad" *ngIf="selectedStudent() as s">
        <h3>Add New Achievement</h3>
        <p class="cell-sub" style="margin-top:2px;margin-bottom:20px">Celebrate the progress and wins of {{ s.firstName }}.</p>

        <div *ngIf="error()" class="alert alert-error" style="margin-bottom:16px">{{ error() }}</div>
        <div *ngIf="successMsg()" class="badge badge-success" style="margin-bottom:16px;padding:8px 12px;width:100%;justify-content:center">{{ successMsg() }}</div>

        <div class="form-grid">
          <div class="field full">
            <label>Achievement Title *</label>
            <input [(ngModel)]="form.title" placeholder="e.g. 1st Place in Special Sports Meet, Improved reading span" />
          </div>
          <div class="field full">
            <label>Date *</label>
            <input type="date" [(ngModel)]="form.date" />
          </div>
          <div class="field full">
            <label>Description / Notes</label>
            <textarea [(ngModel)]="form.description" rows="4" placeholder="Describe the accomplishment or milestone..."></textarea>
          </div>
        </div>

        <div style="margin-top:24px;display:flex;justify-content:flex-end;gap:10px">
          <button class="btn btn-outline" (click)="resetForm()">Reset</button>
          <button class="btn btn-primary" (click)="saveAchievement()" [disabled]="saving() || !form.title">
            {{ saving() ? 'Saving…' : 'Save Achievement' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .achievement-item {
      padding: 16px;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      background: var(--bg);
      margin-bottom: 12px;
      transition: box-shadow 0.15s;
    }
    .achievement-item:hover {
      box-shadow: var(--shadow-sm);
    }
  `]
})
export class AchievementsPage {
  private api = inject(Api);

  students = signal<Student[]>([]);
  selectedStudentId = '';
  selectedStudent = signal<Student | null>(null);
  achievements = signal<Achievement[]>([]);
  
  loadingAchievements = signal(false);
  saving = signal(false);
  error = signal('');
  successMsg = signal('');

  form: Partial<Achievement> = this.blankForm();

  constructor() {
    this.loadStudents();
  }

  blankForm(): Partial<Achievement> {
    return {
      title: '',
      date: new Date().toISOString().substring(0, 10),
      description: ''
    };
  }

  loadStudents() {
    this.api.students().subscribe({
      next: (data) => this.students.set(data.sort((a, b) => a.firstName.localeCompare(b.firstName))),
      error: () => this.error.set('Failed to load students list.')
    });
  }

  onStudentSelect(studentId: string) {
    this.error.set('');
    this.successMsg.set('');
    this.resetForm();
    const student = this.students().find(s => s._id === studentId);
    if (student) {
      this.selectedStudent.set(student);
      this.loadAchievements(studentId);
    } else {
      this.selectedStudent.set(null);
      this.achievements.set([]);
    }
  }

  loadAchievements(studentId: string) {
    this.loadingAchievements.set(true);
    // Fetch the full student profile which contains the subdocuments
    this.api.student(studentId).subscribe({
      next: (student) => {
        this.achievements.set(student.achievements || []);
        this.loadingAchievements.set(false);
      },
      error: () => {
        this.error.set('Failed to load achievements.');
        this.loadingAchievements.set(false);
      }
    });
  }

  saveAchievement() {
    if (!this.selectedStudentId || !this.form.title) return;
    this.saving.set(true);
    this.error.set('');
    this.successMsg.set('');

    this.api.addAchievement(this.selectedStudentId, this.form).subscribe({
      next: () => {
        this.saving.set(false);
        this.successMsg.set('Achievement saved successfully!');
        this.resetForm();
        this.loadAchievements(this.selectedStudentId);
      },
      error: (e) => {
        this.saving.set(false);
        this.error.set(e?.error?.message || 'Failed to save achievement.');
      }
    });
  }

  deleteAchievement(id: string) {
    if (!confirm('Are you sure you want to delete this achievement?')) return;
    this.api.deleteAchievement(this.selectedStudentId, id).subscribe({
      next: () => {
        this.successMsg.set('Achievement deleted successfully!');
        this.loadAchievements(this.selectedStudentId);
      },
      error: () => {
        this.error.set('Failed to delete achievement.');
      }
    });
  }

  resetForm() {
    this.form = this.blankForm();
  }
}
