import type { AttendanceStatusValue } from "@/features/attendance/attendance.types";

export type Career = {
  id: string;
  name: string;
  code: string;
  description: unknown;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: unknown;
};

export type Subject = {
  id: string;
  careerId: string;
  name: string;
  code: string;
  year: number;
  semester: number;
  weeklyHours: number;
  totalHours: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: unknown;
  career: Career;
};

export type AcademicYear = {
  id: string;
  year: number;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: unknown;
};

export type Teacher = {
  id: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
  email: unknown;
};

export type CourseOffering = {
  id: string;
  subjectId: string;
  academicYearId: string;
  teacherId: string;
  commission: string;
  shift: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  classroom: string;
  maxCapacity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: unknown;

  subject: Subject;
  academicYear: AcademicYear;
  teacher: Teacher;
};

export type TeacherCourseOfferingsResponse = {
  success: true;
  data: CourseOffering[];
  timestamp: string;
};

export type TeacherProfileUser = {
  id: string;
  email: string;
  role: "TEACHER";
  isActive: boolean;
  createdAt: string;
};

export type TeacherProfile = {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  documentNumber: string;
  employeeNumber: string;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  user: TeacherProfileUser;
};

export type TeacherProfileResponse = {
  success: true;
  data: TeacherProfile;
  timestamp: string;
};

export type CourseOfferingStudent = {
  id: string;
  userId?: string | null;
  firstName: string;
  lastName: string;
  documentNumber: string;
  studentNumber: string;
  phone?: string | null;
  email?: string | null;
  birthDate?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

export type CourseOfferingStudentsResponse = {
  success: true;
  data: CourseOfferingStudent[];
  timestamp: string;
};

export type ClassSessionStatus = "OPEN" | "CLOSED";

export type ClassSession = {
  id: string;
  courseOfferingId: string;
  date: string;
  status: ClassSessionStatus;
  createdByTeacherId: string;
  createdAt: string;
  updatedAt: string;
  topic?: string | null;
  notes?: string | null;
  deletedAt?: string | null;
};

export type TeacherClassSessionsResponse = {
  success: true;
  data: ClassSession[];
  timestamp: string;
};

export type CreateClassSessionInput = {
  date: string;
  topic: string;
  notes?: string;
};

export type UpdateClassSessionInput = {
  topic: string;
  notes?: string;
};

export type ReopenClassSessionInput = {
  reason: string;
};

export type CreateClassSessionResponse = {
  success: true;
  data: ClassSession;
  timestamp: string;
};

export type ClassSessionResponse = {
  success: true;
  data: ClassSession;
  timestamp: string;
};

export type AttendanceStudentBrief = {
  id: string;
  firstName: string;
  lastName: string;
  studentNumber?: string;
  documentNumber?: string;
};

export type AttendanceRecord = {
  id: string;
  classSessionId: string;
  studentId: string;
  status: AttendanceStatusValue;
  observation?: string | null;
  markedAt: string;
  markedByTeacherId: string;
  createdAt: string;
  updatedAt: string;
  student?: AttendanceStudentBrief;
};

export type SessionAttendanceResponse = {
  success: true;
  data: AttendanceRecord[];
  timestamp: string;
};

export type MarkAttendanceInput = {
  studentId: string;
  status: AttendanceStatusValue;
  observation?: string;
};

export type BulkMarkAttendanceResponse = {
  success: true;
  data: AttendanceRecord[];
  timestamp: string;
};

export type UpdateAttendanceInput = {
  status?: AttendanceStatusValue;
  observation?: string;
};

export type UpdateAttendanceResponse = {
  success: true;
  data: AttendanceRecord;
  timestamp: string;
};