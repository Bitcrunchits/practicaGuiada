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

const ENROLLMENT_STATUS = {
  ACTIVE: "ACTIVE",
  DROPPED: "DROPPED",
  COMPLETED: "COMPLETED",
  VOID: "VOID",
} as const;

export type StudentEnrollmentStatus =
  (typeof ENROLLMENT_STATUS)[keyof typeof ENROLLMENT_STATUS];

const ENROLLMENT_CONDITION = {
  IN_PROGRESS: "IN_PROGRESS",
  REGULAR: "REGULAR",
  NOT_REGULAR: "NOT_REGULAR",
  PROMOTED: "PROMOTED",
  ABANDONED: "ABANDONED",
} as const;

export type StudentEnrollmentCondition =
  (typeof ENROLLMENT_CONDITION)[keyof typeof ENROLLMENT_CONDITION];

const ENROLLMENT_SHIFT = {
  MORNING: "MORNING",
  AFTERNOON: "AFTERNOON",
  EVENING: "EVENING",
  VIRTUAL: "VIRTUAL",
  MIXED: "MIXED",
} as const;

export type StudentEnrollmentShift =
  (typeof ENROLLMENT_SHIFT)[keyof typeof ENROLLMENT_SHIFT];

export type StudentEnrollmentSubject = {
  id: string;
  careerId: string;
  name: string;
  code: string;
  year: number;
  semester: number;
  isActive?: boolean;
};

export type StudentEnrollmentAcademicYear = {
  id: string;
  year: number;
  name: string;
};

export type StudentEnrollmentTeacher = {
  id: string;
  firstName: string;
  lastName: string;
  employeeNumber?: string;
  email?: string | null;
};

export type StudentEnrollmentCourseOffering = {
  id: string;
  subjectId: string;
  academicYearId: string;
  teacherId: string;
  commission: string;
  shift: StudentEnrollmentShift;
  dayOfWeek?: number | null;
  startTime?: string | null;
  endTime?: string | null;
  classroom?: string | null;
  maxCapacity?: number | null;
  isActive: boolean;
  subject: StudentEnrollmentSubject;
  academicYear: StudentEnrollmentAcademicYear;
  teacher?: StudentEnrollmentTeacher | null;
};

export type StudentEnrollment = {
  id: string;
  courseOfferingId: string;
  studentId: string;
  status: StudentEnrollmentStatus;
  condition: StudentEnrollmentCondition;
  resultStatus?: string | null;
  courseAverage?: number | null;
  finalGrade?: number | null;
  observation?: string | null;
  closedAt?: string | null;
  closedById?: string | null;
  resultObservation?: string | null;
  resultSetAt?: string | null;
  enrolledAt: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  student?: unknown;
  courseOffering?: StudentEnrollmentCourseOffering | null;
};

export type StudentEnrollmentsResponse = {
  success: true;
  data: StudentEnrollment[];
  timestamp: string;
};

export type StudentAttendanceTotals = {
  PRESENT: number;
  ABSENT: number;
  LATE: number;
  JUSTIFIED: number;
};

export type StudentAttendanceClassSession = {
  id?: string;
  date?: string;
  topic?: unknown;
  status?: string;
};

export type StudentAttendanceRecord = {
  id?: string;
  classSessionId?: string;
  status?: string;
  observation?: unknown;
  markedAt?: string;
  classSession?: StudentAttendanceClassSession | null;
  session?: StudentAttendanceClassSession | null;
  date?: string;
  topic?: unknown;
};

export type StudentAttendanceData = {
  totals: StudentAttendanceTotals;

  // The OpenAPI declares this as a generic object, so records are read
  // defensively and may miss any of the optional fields.
  records: StudentAttendanceRecord[];
};

export type StudentAttendanceResponse = {
  success: true;
  data: StudentAttendanceData;
  timestamp: string;
};