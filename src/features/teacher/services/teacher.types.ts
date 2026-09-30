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