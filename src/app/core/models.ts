export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'teacher';
  teacher?: string | null;
}

export interface Subject {
  _id?: string;
  name: string;
  code: string;
  description?: string;
  maxScore: number;
  level?: string;
  categories: string[];
}

export interface Teacher {
  _id?: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  email: string;
  phone?: string;
  gender?: string;
  dob?: string;
  address?: string;
  educationalQualifications?: string;
  professionalQualification?: string;
  otherSkills?: string;
  designation?: 'Principal' | 'Teacher';
  designationGrade?: string;
  specializations: string[];
  subjects?: (string | Subject)[];
  joinDate?: string;
  status?: string;
  appointmentDate?: string;
  guardianName?: string;
  guardianPhone?: string;
  pensionDate?: string;
  nic?: string;
}

export interface Medication { name?: string; dosage?: string; schedule?: string; }
export interface MedicalRecord {
  _id?: string;
  date?: string;
  type?: string;
  title: string;
  description?: string;
  recordedBy?: string;
}
export interface Medical {
  bloodGroup?: string;
  allergies?: string[];
  conditions?: string[];
  medications?: Medication[];
  primaryDoctor?: string;
  doctorPhone?: string;
  emergencyContact?: { name?: string; phone?: string; relation?: string };
  notes?: string;
  records?: MedicalRecord[];
}
export interface Student {
  _id?: string;
  admissionNumber: string;
  nameWithInitials?: string;
  fullName?: string;
  firstName: string;
  lastName: string;
  dob?: string;
  gender?: string;
  category: string;
  categories?: string[];
  grade?: string;
  residence?: 'Hostel' | 'Home';
  address?: string;
  assistanceAllowances?: string;
  gramaNiladariDivision?: string;
  divisionNo?: string;
  divisionalSecretaryOffice?: string;
  healthMedicalOfficerDivision?: string;
  enteredDate?: string;
  enrollmentDate?: string;
  exitDate?: string;
  status?: string;
  guardian?: { name?: string; relation?: string; phone?: string; email?: string };
  medical?: Medical;
  achievements?: Achievement[];
  // Provided by GET /students/:id
  averagePercentage?: number | null;
  academicBand?: ColorBand;
  recentBehavior?: BehaviorEntry[];
}

export interface Achievement {
  _id?: string;
  date?: string;
  title: string;
  description?: string;
}

export interface ColorBand { color: string; label: string; min: number | null; }

export interface Sport {
  _id?: string;
  name: string;
  description?: string;
  coach?: string | Teacher | null;
  schedule?: string;
  location?: string;
  adaptive?: boolean;
}

export interface SchoolEvent {
  _id?: string;
  title: string;
  description?: string;
  date: string;
  endDate?: string;
  location?: string;
  type?: string;
  priority: string;
  organizer?: string | Teacher | null;
}

export interface TimetableSlot {
  _id?: string;
  grade: string;
  day: string;
  startTime: string;
  endTime: string;
  subject?: string | Subject | null;
  activity?: string;
  teacher?: string | Teacher | null;
  room?: string;
}

export interface Mark {
  _id?: string;
  student: string | Student;
  subject: string | Subject;
  term: string;
  level: string;
  score: number;
  maxScore: number;
  date?: string;
  percentage?: number;
  remarks?: string;
}

export interface BehaviorEntry {
  _id?: string;
  student: string | Student;
  color: string;
  date?: string;
  note?: string;
  awardedBy?: { name?: string } | string | null;
}

export interface BehaviorRankRow {
  rank: number;
  student: { id: string; fullName: string; admissionNumber: string; category: string };
  counts: { Green: number; Yellow: number; Red: number };
  total: number;
  score: number;
  currentColor: string;
}

export interface MarksRankRow {
  rank: number | null;
  average: number | null;
  entries: number;
  band: ColorBand;
  student: { id: string; fullName: string; admissionNumber: string; category: string };
}

export interface ReportCard {
  student: { id: string; fullName: string; admissionNumber: string; category: string };
  subjects: {
    subject: Subject;
    count: number;
    average: number;
    band: ColorBand;
    entries: Mark[];
  }[];
  overallAverage: number | null;
  academicBand: ColorBand;
}

export interface DashboardData {
  counts: { students: number; teachers: number; subjects: number };
  byCategory: { category: string; count: number }[];
  birthdays: {
    students: { id: string; name: string; admissionNumber: string; category: string }[];
    teachers: { id: string; name: string; employeeId: string; designation: string }[];
  };
  upcomingEvents: SchoolEvent[];
}
