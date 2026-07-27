import { Component, ElementRef, QueryList, ViewChildren, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Api } from '../core/api';
import { Student, Subject, Mark } from '../core/models';
import { TERMS, GRADES, catKey } from '../core/config';

interface Row {
  student: Student;
  markId?: string;
  score: number | null;
}

@Component({
  selector: 'app-marks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <div><h1>Marks & Calculation</h1><p>Pick a subject, then record scores for every student who takes it</p></div>
    </div>

    <div class="toolbar">
      <label class="row" style="gap:8px">Class grade:
        <select [(ngModel)]="gradeFilter" (ngModelChange)="build()">
          <option [ngValue]="''">All grades</option>
          <option *ngFor="let g of grades" [ngValue]="g">Grade {{ g }}</option>
        </select>
      </label>
      <label class="row" style="gap:8px">Term:
        <select [(ngModel)]="term" (ngModelChange)="build()"><option *ngFor="let t of terms" [value]="t">{{ t }}</option></select>
      </label>
      <label class="row" style="gap:8px">Subject:
        <select [(ngModel)]="subjectId" (ngModelChange)="onSubject()" style="min-width:260px">
          <option value="">— Select a subject —</option>
          <option *ngFor="let s of subjects()" [value]="s._id">{{ s.name }} ({{ s.code }})</option>
        </select>
      </label>
    </div>

    <div *ngIf="!subject()" class="empty">Select a subject to record marks.</div>

    <ng-container *ngIf="subject() as subj">
      <div *ngIf="loading()" class="spinner"></div>
      <div class="card" *ngIf="!loading()">
        <div class="card-head">
          <h3>{{ subj.name }} · {{ term }}</h3>
          <span class="muted">{{ rows().length }} student(s) · max score {{ subj.maxScore }}</span>
        </div>
        <div class="table-wrap">
          <table class="table">
            <thead><tr><th>Student</th><th>Category</th><th class="right">Score</th><th class="right">%</th><th>Status</th></tr></thead>
            <tbody>
              <tr *ngFor="let r of rows(); let i = index">
                <td><div class="cell-strong">{{ displayName(r.student) }}</div><div class="cell-sub">{{ r.student.admissionNumber }}</div></td>
                <td><span class="badge cat-{{ key(r.student.category) }}">{{ r.student.category }}</span></td>
                <td class="right">
                  <input #score type="number" min="0" [max]="subj.maxScore" [(ngModel)]="r.score" (keydown)="onKey($event, i)" placeholder="—" style="width:90px;text-align:right" />
                  <span class="muted"> / {{ subj.maxScore }}</span>
                </td>
                <td class="right">{{ r.score != null ? pct(r.score, subj.maxScore) + '%' : '—' }}</td>
                <td>
                  <span *ngIf="r.markId" class="badge badge-success">Recorded</span>
                  <span *ngIf="!r.markId" class="badge badge-soft">Not entered</span>
                </td>
              </tr>
              <tr *ngIf="!rows().length"><td colspan="5" class="muted center">No students take this subject.</td></tr>
            </tbody>
          </table>
        </div>
        <div class="card-pad row" style="justify-content:space-between;align-items:center">
          <span class="muted">{{ message() }}</span>
          <button class="btn btn-primary" (click)="saveAll()" [disabled]="saving() || !rows().length">{{ saving() ? 'Saving…' : 'Save all marks' }}</button>
        </div>
      </div>
    </ng-container>
  `,
})
export class MarksPage {
  private api = inject(Api);
  terms = TERMS;
  grades = GRADES;
  key = catKey;

  @ViewChildren('score') scoreInputs!: QueryList<ElementRef<HTMLInputElement>>;

  students = signal<Student[]>([]);
  subjects = signal<Subject[]>([]);
  subject = signal<Subject | null>(null);
  rows = signal<Row[]>([]);
  loading = signal(false);
  saving = signal(false);
  message = signal('');

  subjectId = '';
  term: string = 'Term 1';
  gradeFilter: string = '';

  constructor() {
    this.api.students().subscribe((s) => this.students.set(s));
    this.api.subjects().subscribe((s) => this.subjects.set(s));
  }

  onSubject() {
    this.subject.set(this.subjects().find((s) => s._id === this.subjectId) || null);
    this.build();
  }

  // Loads the students who take the selected subject and pre-fills any existing score.
  build() {
    const subj = this.subject();
    const level = subj?.level || 'Primary';
    this.message.set('');
    if (!subj) { this.rows.set([]); return; }
    this.loading.set(true);
    this.api.marks({ subject: subj._id, term: this.term }).subscribe({
      next: (marks) => {
        // A student takes a subject when the subject applies to all categories, or to theirs.
        const applicable = this.students().filter(
          (s) =>
            (!subj.categories.length || subj.categories.includes(s.category))
            && (this.gradeFilter === '' || s.grade === this.gradeFilter)
        );
        const rows: Row[] = applicable.map((s) => {
          const existing = marks.find((m) => this.idOf(m.student) === s._id && m.level === level);
          return { student: s, markId: existing?._id, score: existing ? existing.score : null };
        });
        this.rows.set(rows);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  idOf(x: any) { return x && typeof x === 'object' ? x._id : x; }
  pct(score: number, max: number) { return Math.round((Number(score) / max) * 10000) / 100; }
  displayName(s: Student) { return s.fullName || s.nameWithInitials || [s.firstName, s.lastName].filter(Boolean).join(' ').trim() || '—'; }

  // Arrow Up/Down (and Enter) move focus between score inputs instead of stepping the number.
  onKey(e: KeyboardEvent, i: number) {
    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault();
      this.focusInput(i + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.focusInput(i - 1);
    }
  }

  private focusInput(i: number) {
    const el = this.scoreInputs?.toArray()[i]?.nativeElement;
    if (el) { el.focus(); el.select(); }
  }

  saveAll() {
    const subj = this.subject();
    if (!subj) return;
    const level = subj.level || 'Primary';
    const ops = this.rows()
      .filter((r) => r.score !== null && (r.score as any) !== '')
      .map((r) => {
        const body: Partial<Mark> = {
          student: r.student._id!,
          subject: subj._id!,
          term: this.term,
          level,
          score: Number(r.score),
          maxScore: subj.maxScore,
        };
        return r.markId ? this.api.updateMark(r.markId, body) : this.api.createMark(body);
      });

    if (!ops.length) { this.message.set('Enter at least one score first.'); return; }
    this.saving.set(true);
    forkJoin(ops).subscribe({
      next: () => { this.saving.set(false); this.message.set(`Saved ${ops.length} mark(s).`); this.build(); },
      error: (e) => { this.saving.set(false); this.message.set(e?.error?.message || 'Save failed'); },
    });
  }
}
