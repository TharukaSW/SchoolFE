// Application routes setup
import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './core/auth-guard';
import { Shell } from './layout/shell';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login').then((m) => m.LoginPage) },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard').then((m) => m.DashboardPage) },
      { path: 'teachers', loadComponent: () => import('./pages/teachers').then((m) => m.TeachersPage) },
      { path: 'students', loadComponent: () => import('./pages/students').then((m) => m.StudentsPage) },
      { path: 'students/:id', loadComponent: () => import('./pages/student-detail').then((m) => m.StudentDetailPage) },
      { path: 'timetable', loadComponent: () => import('./pages/timetable').then((m) => m.TimetablePage) },
      { path: 'marks', loadComponent: () => import('./pages/marks').then((m) => m.MarksPage) },
      { path: 'ranking', loadComponent: () => import('./pages/ranking').then((m) => m.RankingPage) },
      { path: 'subjects', loadComponent: () => import('./pages/subjects').then((m) => m.SubjectsPage), canActivate: [adminGuard] },
      { path: 'sports', loadComponent: () => import('./pages/sports').then((m) => m.SportsPage), canActivate: [adminGuard] },
      { path: 'events', loadComponent: () => import('./pages/events').then((m) => m.EventsPage) },
      { path: 'achievements', loadComponent: () => import('./pages/achievements').then((m) => m.AchievementsPage) },
    ],
  },
  { path: '**', redirectTo: '' },
];
