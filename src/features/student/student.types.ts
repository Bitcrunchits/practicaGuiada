export type StudentCareer = {
  id: string;
  name: string;
  code: string;
  description: string;
  isActive: boolean;
};

export type StudentStudyPlan = {
  id: string;
  code: string;
  name: string;
  description: string;
};

export type StudentAcademicYear = {
  id: string;
  year: number;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
};

// Materia que pertenece al plan de estudios
export type StudentSubject = {
  id: string;
  name: string;
  code: string;
  year: number;
  semester: number;
  weeklyHours: number;
  totalHours: number;
  isActive: boolean;
};

// Cada elemento del plan de estudios
export type StudentStudyPlanItem = {
  id: string;
  subjectId: string;

  // Año de la carrera: 1, 2, 3...
  year: number;

  // 0 = anual, 1 = primer semestre, 2 = segundo semestre
  semester: number;

  term:
    | "ANNUAL"
    | "FIRST_SEMESTER"
    | "SECOND_SEMESTER";

  isOptional: boolean;
  sortOrder: number;

  subject: StudentSubject;

  // Por ahora lo dejamos como string.
  // Más adelante podemos tipar todos los estados posibles.
  enrollmentStatus: string;
};

export type StudentStudyPlanData = {
  career: StudentCareer;
  studyPlan: StudentStudyPlan;
  academicYear: StudentAcademicYear;

  // Materias que forman parte del plan
  items: StudentStudyPlanItem[];
};

export type StudentStudyPlanResponse = {
  success: true;
  data: StudentStudyPlanData;
  timestamp: string;
};

export type StudentSubjectTeacher = {
  id: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
  email: string;
};

export type StudentSubjectOffering = {
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

  // La API los devuelve como string
  promoteMinAverage: string;
  regularMinAverage: string;
  minAttendancePercent: string;

  promoteEnabled: boolean;
  isActive: boolean;

  teacher: StudentSubjectTeacher;
};

export type StudentSubjectEnrollment = {
  id: string;
  courseOfferingId: string;
  studentId: string;
  status: string;
  resultStatus: string;
  finalGrade: number | null;
  resultObservation: string | null;
  enrolledAt: string;

  courseOffering: StudentSubjectOffering;
};

export type StudentSubjectDetail = {
  planItem: {
    id: string;
    studyPlanId: string;
    subjectId: string;
    year: number;
    semester: number;
    term: string;
    isOptional: boolean;
    sortOrder: number;
  };

  subject: {
    id: string;
    name: string;
    code: string;
    year: number;
    semester: number;
    weeklyHours: number;
    totalHours: number;
    program: unknown | null;
  };

  academicYear: StudentAcademicYear;

  enrollmentPeriodOpen: boolean;

  myEnrollment: StudentSubjectEnrollment | null;

  offerings: StudentSubjectOffering[];
};

export type StudentSubjectDetailResponse = {
  success: true;
  data: StudentSubjectDetail;
  timestamp: string;
};

export type StudentAttendanceTotals = {
  PRESENT: number;
  ABSENT: number;
  LATE: number;
  JUSTIFIED: number;
};

export type StudentAttendanceData = {
  totals: StudentAttendanceTotals;

  // Todavía no conocemos la estructura interna
  // porque el backend devolvió [].
  records: unknown[];
};

export type StudentAttendanceResponse = {
  success: true;
  data: StudentAttendanceData;
  timestamp: string;
};