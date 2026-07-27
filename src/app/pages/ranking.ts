import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Api } from '../core/api';
import { MarksRankRow, BehaviorRankRow } from '../core/models';
import { catKey } from '../core/config';

@Component({
  selector: 'app-ranking',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-header">
      <div>
        <h1>Rankings & Colours</h1>
        <p>Academic support colour bands and teacher-awarded behaviour tracking colours.</p>
      </div>
    </div>

    <div class="toolbar">
      <button class="btn" [ngClass]="tab() === 'academic' ? 'btn-primary' : 'btn-outline'" (click)="tab.set('academic')">Academic Rankings</button>
      <button class="btn" [ngClass]="tab() === 'behaviour' ? 'btn-primary' : 'btn-outline'" (click)="tab.set('behaviour')">Behaviour Colours</button>
    </div>

    <!-- Academic Rankings Tab -->
    <div class="card" *ngIf="tab() === 'academic'">
      <div class="card-head">
        <h3>Student Academic Standings</h3>
        <span class="muted">Ranked by average score</span>
      </div>
      
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Student</th>
              <th>Category</th>
              <th class="right">Average</th>
              <th>Band</th>
              <th>Entries Logged</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of academic()">
              <td><span class="rank-badge" [ngClass]="'rank-' + r.rank">{{ r.rank ?? '—' }}</span></td>
              <td>
                <a [routerLink]="['/students', r.student.id]" class="cell-strong">{{ r.student.fullName }}</a>
                <div class="cell-sub">{{ r.student.admissionNumber }}</div>
              </td>
              <td><span class="badge cat-{{ key(r.student.category) }}">{{ r.student.category }}</span></td>
              <td class="right"><strong>{{ r.average != null ? r.average + '%' : '—' }}</strong></td>
              <td>
                <span class="chip clr-{{ r.band.color }}">
                  <span class="swatch"></span>{{ r.band.color }} · {{ r.band.label }}
                </span>
              </td>
              <td>{{ r.entries }}</td>
            </tr>
            <tr *ngIf="!academic().length">
              <td colspan="6" class="muted center" style="padding: 40px 20px">No academic records found to rank.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Behaviour Colours Tab -->
    <div class="card" *ngIf="tab() === 'behaviour'">
      <div class="card-head">
        <h3>Behaviour Colour Standings</h3>
        <span class="muted">Points: Green +2 · Yellow 0 · Red −1</span>
      </div>
      
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Student</th>
              <th>Current Status</th>
              <th class="center">Green</th>
              <th class="center">Yellow</th>
              <th class="center">Red</th>
              <th class="right">Score</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of behaviour()">
              <td><span class="rank-badge" [ngClass]="'rank-' + r.rank">{{ r.rank }}</span></td>
              <td>
                <a [routerLink]="['/students', r.student.id]" class="cell-strong">{{ r.student.fullName }}</a>
                <div class="cell-sub">{{ r.student.category }}</div>
              </td>
              <td><span class="chip clr-{{ r.currentColor }}"><span class="swatch"></span>{{ r.currentColor }}</span></td>
              <td class="center">{{ r.counts.Green }}</td>
              <td class="center">{{ r.counts.Yellow }}</td>
              <td class="center">{{ r.counts.Red }}</td>
              <td class="right"><strong>{{ r.score }}</strong></td>
            </tr>
            <tr *ngIf="!behaviour().length">
              <td colspan="7" class="muted center" style="padding: 40px 20px">No behaviour colours awarded yet.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class RankingPage {
  private api = inject(Api);
  key = catKey;
  
  tab = signal<'academic' | 'behaviour'>('academic');
  academic = signal<MarksRankRow[]>([]);
  behaviour = signal<BehaviorRankRow[]>([]);

  constructor() {
    this.api.marksSummary().subscribe((r) => this.academic.set(r));
    this.api.behaviorRanking().subscribe((r) => this.behaviour.set(r));
  }
}
