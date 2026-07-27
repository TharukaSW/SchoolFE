import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Api } from '../core/api';
import { Student, ReportCard, BehaviorEntry, MedicalRecord } from '../core/models';
import { BEHAVIOR_COLORS, catKey } from '../core/config';

@Component({
  selector: 'app-student-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <a routerLink="/students" class="btn btn-ghost btn-sm mb-2">Back to students</a>
    <div *ngIf="loading()" class="spinner"></div>

    <ng-container *ngIf="student() as s">
      <!-- Header -->
      <div class="card card-pad mb-2">
        <div class="row wrap" style="justify-content:space-between;align-items:flex-start">
          <div class="row" style="gap:16px">
            <div class="avatar" style="width:60px;height:60px;font-size:22px">{{ initials(s) }}</div>
            <div>
              <h1 style="font-size:22px">{{ displayName(s) }}</h1>
              <div class="cell-sub" *ngIf="s.nameWithInitials">{{ s.nameWithInitials }}</div>
              <div class="row wrap mt-1" style="gap:4px">
                <span *ngFor="let cat of getCategories(s)" class="badge cat-{{ key(cat) }}">{{ cat }}</span>
                <span class="badge badge-soft">{{ s.admissionNumber }}</span>
                <span class="chip clr-{{ s.academicBand?.color }}"><span class="swatch"></span>{{ s.academicBand?.color }} band</span>
              </div>
            </div>
          </div>
          <div class="right">
            <div class="stat-val">{{ s.averagePercentage != null ? (s.averagePercentage + '%') : '—' }}</div>
            <div class="stat-label">Academic average</div>
          </div>
        </div>
        <div class="grid grid-4 mt-3">
          <div><div class="cell-sub">Gender / Age</div><div>{{ s.gender }} · {{ age(s.dob) }} yrs</div></div>
          <div><div class="cell-sub">Residence</div><div>{{ s.residence || '—' }}</div></div>
          <div><div class="cell-sub">Guardian</div><div>{{ s.guardian?.name || '—' }} <span class="cell-sub">{{ s.guardian?.phone }}</span></div></div>
          <div><div class="cell-sub">Status</div><div>{{ s.status }}</div></div>
        </div>
        <div class="grid grid-4 mt-2">
          <div><div class="cell-sub">Name with initials</div><div>{{ s.nameWithInitials || '—' }}</div></div>
          <div><div class="cell-sub">Full name</div><div>{{ s.fullName || displayName(s) }}</div></div>
          <div><div class="cell-sub">Entered / Exit</div><div>{{ labelDate(s.enteredDate || s.enrollmentDate) }} <span class="cell-sub">→ {{ labelDate(s.exitDate) }}</span></div></div>
          <div><div class="cell-sub">Assistance allowances</div><div>{{ s.assistanceAllowances || '—' }}</div></div>
        </div>
        <div class="grid grid-4 mt-2">
          <div><div class="cell-sub">Grama Niladari division</div><div>{{ s.gramaNiladariDivision || '—' }}</div></div>
          <div><div class="cell-sub">Division no.</div><div>{{ s.divisionNo || '—' }}</div></div>
          <div><div class="cell-sub">Divisional secretary office</div><div>{{ s.divisionalSecretaryOffice || '—' }}</div></div>
          <div><div class="cell-sub">Health medical officer division</div><div>{{ s.healthMedicalOfficerDivision || '—' }}</div></div>
        </div>
      </div>

      <div class="grid grid-2 mb-2">
        <!-- Report card -->
        <div class="card">
          <div class="card-head"><h3>Report Card</h3><span class="chip clr-{{ report()?.academicBand?.color }}"><span class="swatch"></span>{{ report()?.academicBand?.label }}</span></div>
          <div class="card-pad">
            <div class="table-wrap">
              <table class="table">
                <thead><tr><th>Subject</th><th>Entries</th><th class="right">Average</th><th>Band</th></tr></thead>
                <tbody>
                  <tr *ngFor="let r of report()?.subjects || []">
                    <td class="cell-strong">{{ r.subject?.name }}</td>
                    <td>{{ r.count }}</td>
                    <td class="right">{{ r.average }}%</td>
                    <td><span class="chip clr-{{ r.band.color }}"><span class="swatch"></span>{{ r.band.color }}</span></td>
                  </tr>
                  <tr *ngIf="!(report()?.subjects || []).length"><td colspan="4" class="muted center">No marks recorded yet.</td></tr>
                </tbody>
              </table>
            </div>
            <div class="row mt-2" style="justify-content:space-between" *ngIf="report()?.overallAverage != null">
              <strong>Overall average</strong>
              <strong>{{ report()?.overallAverage }}%</strong>
            </div>
          </div>
        </div>

        <!-- Behaviour colours -->
        <div class="card">
          <div class="card-head"><h3>Behaviour Colours</h3></div>
          <div class="card-pad">
            <div class="row wrap mb-2">
              <button *ngFor="let c of colors" class="chip clr-{{ c }}" style="border:2px solid transparent;cursor:pointer"
                      [style.border-color]="newColor === c ? 'currentColor' : 'transparent'" (click)="newColor = c">
                <span class="swatch"></span>{{ c }}
              </button>
            </div>
            <div class="row" style="gap:8px">
              <input placeholder="Optional note…" [(ngModel)]="newNote" />
              <button class="btn btn-primary" (click)="award()" [disabled]="awarding()">Award</button>
            </div>
            <div class="mt-3">
              <div *ngFor="let b of s.recentBehavior || []" class="row" style="justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
                <div class="row" style="gap:10px">
                  <span class="chip clr-{{ b.color }}"><span class="swatch"></span>{{ b.color }}</span>
                  <span class="cell-sub">{{ b.note }}</span>
                </div>
                <div class="row" style="gap:8px">
                  <span class="cell-sub">{{ b.date | date: 'MMM d' }}</span>
                  <button class="btn btn-ghost btn-sm" (click)="removeBehavior(b)">✕</button>
                </div>
              </div>
              <p *ngIf="!(s.recentBehavior || []).length" class="muted">No colours awarded yet.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Medical -->
      <div class="card">
        <div class="card-head">
          <h3>Medical Records</h3>
          <button class="btn btn-outline btn-sm" (click)="openMedical()">Edit medical profile</button>
        </div>
        <div class="card-pad">
          <div class="grid grid-4 mb-2">
            <div><div class="cell-sub">Blood group</div><div>{{ s.medical?.bloodGroup || '—' }}</div></div>
            <div><div class="cell-sub">Primary doctor</div><div>{{ s.medical?.primaryDoctor || '—' }} <span class="cell-sub">{{ s.medical?.doctorPhone }}</span></div></div>
            <div><div class="cell-sub">Emergency contact</div><div>{{ s.medical?.emergencyContact?.name || '—' }} <span class="cell-sub">{{ s.medical?.emergencyContact?.phone }}</span></div></div>
            <div><div class="cell-sub">Allergies</div><div>{{ (s.medical?.allergies || []).join(', ') || 'None' }}</div></div>
          </div>
          <div class="grid grid-2 mb-2">
            <div>
              <div class="cell-sub">Conditions</div>
              <div class="row wrap mt-1">
                <span *ngFor="let c of s.medical?.conditions || []" class="badge badge-warning">{{ c }}</span>
                <span *ngIf="!(s.medical?.conditions || []).length" class="muted">None recorded</span>
              </div>
            </div>
            <div>
              <div class="cell-sub">Medications</div>
              <div class="mt-1">
                <div *ngFor="let m of s.medical?.medications || []">{{ m.name }} <span class="cell-sub">{{ m.dosage }} · {{ m.schedule }}</span></div>
                <span *ngIf="!(s.medical?.medications || []).length" class="muted">None</span>
              </div>
            </div>
          </div>
          <div *ngIf="s.medical?.notes" class="alert alert-info">{{ s.medical?.notes }}</div>

          <div class="card-head" style="padding-left:0;padding-right:0"><h3>Records log</h3><button class="btn btn-primary btn-sm" (click)="showRecord.set(true)">+ Add record</button></div>
          <div class="table-wrap">
            <table class="table">
              <thead><tr><th>Date</th><th>Type</th><th>Title</th><th>Description</th><th>By</th><th></th></tr></thead>
              <tbody>
                <tr *ngFor="let r of s.medical?.records || []">
                  <td>{{ r.date | date: 'MMM d, y' }}</td>
                  <td><span class="badge badge-soft">{{ r.type }}</span></td>
                  <td class="cell-strong">{{ r.title }}</td>
                  <td class="cell-sub">{{ r.description }}</td>
                  <td>{{ r.recordedBy || '—' }}</td>
                  <td class="actions"><button class="btn btn-ghost btn-sm" (click)="removeRecord(r)">✕</button></td>
                </tr>
                <tr *ngIf="!(s.medical?.records || []).length"><td colspan="6" class="muted center">No medical records logged.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ng-container>

    <!-- Add medical record modal -->
    <div class="modal-backdrop" *ngIf="showRecord()" (click)="showRecord.set(false)">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-head"><h3>Add Medical Record</h3><button class="btn btn-ghost" (click)="showRecord.set(false)">✕</button></div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="field"><label>Date</label><input type="date" [(ngModel)]="record.date" /></div>
            <div class="field"><label>Type</label>
              <select [(ngModel)]="record.type"><option>Checkup</option><option>Incident</option><option>Therapy</option><option>Medication Change</option><option>Allergy</option><option>Other</option></select>
            </div>
            <div class="field full"><label>Title *</label><input [(ngModel)]="record.title" /></div>
            <div class="field full"><label>Description</label><textarea [(ngModel)]="record.description"></textarea></div>
            <div class="field"><label>Recorded by</label><input [(ngModel)]="record.recordedBy" /></div>
          </div>
        </div>
        <div class="modal-foot"><button class="btn btn-outline" (click)="showRecord.set(false)">Cancel</button><button class="btn btn-primary" (click)="saveRecord()">Add record</button></div>
      </div>
    </div>

    <!-- Edit medical profile modal -->
    <div class="modal-backdrop" *ngIf="showMedical()" (click)="showMedical.set(false)">
      <div class="modal wide" (click)="$event.stopPropagation()">
        <div class="modal-head"><h3>Edit Medical Profile</h3><button class="btn btn-ghost" (click)="showMedical.set(false)">✕</button></div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="field"><label>Blood group</label><input [(ngModel)]="med.bloodGroup" /></div>
            <div class="field"><label>Primary doctor</label><input [(ngModel)]="med.primaryDoctor" /></div>
            <div class="field"><label>Doctor phone</label><input [(ngModel)]="med.doctorPhone" /></div>
            <div class="field"><label>Allergies (comma separated)</label><input [(ngModel)]="allergiesStr" /></div>
            <div class="field full"><label>Conditions (comma separated)</label><input [(ngModel)]="conditionsStr" /></div>
            <div class="field"><label>Emergency contact name</label><input [(ngModel)]="emergencyName" /></div>
            <div class="field"><label>Emergency contact phone</label><input [(ngModel)]="emergencyPhone" /></div>
            <div class="field full"><label>Notes</label><textarea [(ngModel)]="med.notes"></textarea></div>
          </div>
          <div class="card-head" style="padding-left:0"><h3>Medications</h3><button class="btn btn-outline btn-sm" (click)="addMed()">+ Add</button></div>
          <div *ngFor="let m of meds; let i = index" class="row" style="gap:8px;margin-bottom:8px">
            <input placeholder="Name" [(ngModel)]="m.name" />
            <input placeholder="Dosage" [(ngModel)]="m.dosage" />
            <input placeholder="Schedule" [(ngModel)]="m.schedule" />
            <button class="btn btn-ghost btn-sm" (click)="meds.splice(i, 1)">✕</button>
          </div>
        </div>
        <div class="modal-foot"><button class="btn btn-outline" (click)="showMedical.set(false)">Cancel</button><button class="btn btn-primary" (click)="saveMedical()">Save profile</button></div>
      </div>
    </div>
  `,
})
export class StudentDetailPage {
  private api = inject(Api);
  private route = inject(ActivatedRoute);
  colors = BEHAVIOR_COLORS;
  key = catKey;

  id = this.route.snapshot.paramMap.get('id')!;
  student = signal<Student | null>(null);
  report = signal<ReportCard | null>(null);
  loading = signal(true);

  newColor = 'Green';
  newNote = '';
  awarding = signal(false);

  showRecord = signal(false);
  record: Partial<MedicalRecord> = { type: 'Checkup', title: '' };

  showMedical = signal(false);
  med: any = {};
  meds: any[] = [];
  allergiesStr = '';
  conditionsStr = '';
  emergencyName = '';
  emergencyPhone = '';

  constructor() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.student(this.id).subscribe({
      next: (s) => { this.student.set(s); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
    this.api.report(this.id).subscribe((r) => this.report.set(r));
  }

  getCategories(s: Student): string[] {
    if (s.categories && s.categories.length) return s.categories;
    if (s.category) return s.category.split(',').map((x) => x.trim()).filter(Boolean);
    return [];
  }
  initials(s: Student) {
    const source = this.displayName(s);
    return source === '—' ? 'S' : source.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  }
  displayName(s: Student) {
    return s.fullName || s.nameWithInitials || [s.firstName, s.lastName].filter(Boolean).join(' ').trim() || '—';
  }
  labelDate(value?: string) { return value ? value.slice(0, 10) : '—'; }
  age(dob?: string) { return dob ? Math.floor((Date.now() - new Date(dob).getTime()) / 31557600000) : '—'; }

  award() {
    this.awarding.set(true);
    this.api.createBehavior({ student: this.id, color: this.newColor, note: this.newNote }).subscribe({
      next: () => { this.awarding.set(false); this.newNote = ''; this.load(); },
      error: () => this.awarding.set(false),
    });
  }
  removeBehavior(b: BehaviorEntry) {
    if (!confirm('Remove this colour entry?')) return;
    this.api.deleteBehavior(b._id!).subscribe(() => this.load());
  }

  saveRecord() {
    if (!this.record.title) return;
    this.api.addMedicalRecord(this.id, this.record).subscribe(() => {
      this.showRecord.set(false);
      this.record = { type: 'Checkup', title: '' };
      this.load();
    });
  }
  removeRecord(r: MedicalRecord) {
    if (!confirm('Delete this medical record?')) return;
    this.api.deleteMedicalRecord(this.id, r._id!).subscribe(() => this.load());
  }

  openMedical() {
    const m = this.student()?.medical || {};
    this.med = { bloodGroup: m.bloodGroup, primaryDoctor: m.primaryDoctor, doctorPhone: m.doctorPhone, notes: m.notes };
    this.meds = (m.medications || []).map((x) => ({ ...x }));
    this.allergiesStr = (m.allergies || []).join(', ');
    this.conditionsStr = (m.conditions || []).join(', ');
    this.emergencyName = m.emergencyContact?.name || '';
    this.emergencyPhone = m.emergencyContact?.phone || '';
    this.showMedical.set(true);
  }
  addMed() { this.meds.push({ name: '', dosage: '', schedule: '' }); }
  saveMedical() {
    const body = {
      ...this.med,
      allergies: this.allergiesStr.split(',').map((x) => x.trim()).filter(Boolean),
      conditions: this.conditionsStr.split(',').map((x) => x.trim()).filter(Boolean),
      medications: this.meds.filter((m) => m.name),
      emergencyContact: { name: this.emergencyName, phone: this.emergencyPhone },
    };
    this.api.updateMedicalProfile(this.id, body).subscribe(() => { this.showMedical.set(false); this.load(); });
  }
}
