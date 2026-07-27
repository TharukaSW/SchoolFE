import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from './config';
import {
  Teacher, Student, Subject, Sport, SchoolEvent, TimetableSlot, Mark,
  BehaviorEntry, BehaviorRankRow, MarksRankRow, ReportCard, DashboardData,
  MedicalRecord, Medical, Achievement,
} from './models';

function toParams(query?: Record<string, any>): HttpParams {
  let params = new HttpParams();
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    });
  }
  return params;
}

@Injectable({ providedIn: 'root' })
export class Api {
  private http = inject(HttpClient);
  private url = (p: string) => `${API_BASE}${p}`;

  // Generic helpers
  private list<T>(path: string, query?: Record<string, any>): Observable<T[]> {
    return this.http.get<T[]>(this.url(path), { params: toParams(query) });
  }

  // Dashboard
  dashboard() { return this.http.get<DashboardData>(this.url('/dashboard')); }

  // Teachers
  teachers(query?: Record<string, any>) { return this.list<Teacher>('/teachers', query); }
  teacher(id: string) { return this.http.get<Teacher>(this.url(`/teachers/${id}`)); }
  createTeacher(body: Partial<Teacher>) { return this.http.post<Teacher>(this.url('/teachers'), body); }
  updateTeacher(id: string, body: Partial<Teacher>) { return this.http.put<Teacher>(this.url(`/teachers/${id}`), body); }
  deleteTeacher(id: string) { return this.http.delete(this.url(`/teachers/${id}`)); }

  // Students
  students(query?: Record<string, any>) { return this.list<Student>('/students', query); }
  student(id: string) { return this.http.get<Student>(this.url(`/students/${id}`)); }
  createStudent(body: Partial<Student>) { return this.http.post<Student>(this.url('/students'), body); }
  updateStudent(id: string, body: Partial<Student>) { return this.http.put<Student>(this.url(`/students/${id}`), body); }
  deleteStudent(id: string) { return this.http.delete(this.url(`/students/${id}`)); }
  updateMedicalProfile(id: string, body: Partial<Medical>) { return this.http.put<Medical>(this.url(`/students/${id}/medical`), body); }
  addMedicalRecord(id: string, body: Partial<MedicalRecord>) { return this.http.post<MedicalRecord>(this.url(`/students/${id}/medical-records`), body); }
  deleteMedicalRecord(id: string, recordId: string) { return this.http.delete(this.url(`/students/${id}/medical-records/${recordId}`)); }
  addAchievement(id: string, body: Partial<Achievement>) { return this.http.post<Achievement>(this.url(`/students/${id}/achievements`), body); }
  deleteAchievement(id: string, achievementId: string) { return this.http.delete(this.url(`/students/${id}/achievements/${achievementId}`)); }

  // Subjects
  subjects(query?: Record<string, any>) { return this.list<Subject>('/subjects', query); }
  createSubject(body: Partial<Subject>) { return this.http.post<Subject>(this.url('/subjects'), body); }
  updateSubject(id: string, body: Partial<Subject>) { return this.http.put<Subject>(this.url(`/subjects/${id}`), body); }
  deleteSubject(id: string) { return this.http.delete(this.url(`/subjects/${id}`)); }

  // Sports
  sports(query?: Record<string, any>) { return this.list<Sport>('/sports', query); }
  createSport(body: Partial<Sport>) { return this.http.post<Sport>(this.url('/sports'), body); }
  updateSport(id: string, body: Partial<Sport>) { return this.http.put<Sport>(this.url(`/sports/${id}`), body); }
  deleteSport(id: string) { return this.http.delete(this.url(`/sports/${id}`)); }

  // Events
  events(query?: Record<string, any>) { return this.list<SchoolEvent>('/events', query); }
  createEvent(body: Partial<SchoolEvent>) { return this.http.post<SchoolEvent>(this.url('/events'), body); }
  updateEvent(id: string, body: Partial<SchoolEvent>) { return this.http.put<SchoolEvent>(this.url(`/events/${id}`), body); }
  deleteEvent(id: string) { return this.http.delete(this.url(`/events/${id}`)); }

  // Timetable
  timetable(query?: Record<string, any>) { return this.list<TimetableSlot>('/timetable', query); }
  createSlot(body: Partial<TimetableSlot>) { return this.http.post<TimetableSlot>(this.url('/timetable'), body); }
  updateSlot(id: string, body: Partial<TimetableSlot>) { return this.http.put<TimetableSlot>(this.url(`/timetable/${id}`), body); }
  deleteSlot(id: string) { return this.http.delete(this.url(`/timetable/${id}`)); }

  // Marks
  marks(query?: Record<string, any>) { return this.list<Mark>('/marks', query); }
  createMark(body: Partial<Mark>) { return this.http.post<Mark>(this.url('/marks'), body); }
  updateMark(id: string, body: Partial<Mark>) { return this.http.put<Mark>(this.url(`/marks/${id}`), body); }
  deleteMark(id: string) { return this.http.delete(this.url(`/marks/${id}`)); }
  marksSummary() { return this.http.get<MarksRankRow[]>(this.url('/marks/summary')); }
  report(studentId: string) { return this.http.get<ReportCard>(this.url(`/marks/report/${studentId}`)); }

  // Behaviour
  behavior(query?: Record<string, any>) { return this.list<BehaviorEntry>('/behavior', query); }
  createBehavior(body: Partial<BehaviorEntry>) { return this.http.post<BehaviorEntry>(this.url('/behavior'), body); }
  deleteBehavior(id: string) { return this.http.delete(this.url(`/behavior/${id}`)); }
  behaviorRanking() { return this.http.get<BehaviorRankRow[]>(this.url('/behavior/ranking')); }
}
