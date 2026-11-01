import type {
  AttendanceRecord,
  ClassSession,
  CourseOfferingStudent,
} from "@/features/teacher/services/teacher.types";

import {
  isAttendanceStatusValue,
  type AttendanceStatusValue,
} from "./attendance.types";

export type AttendanceCounts = Record<AttendanceStatusValue, number>;

export type OfferingAttendanceRecord = {
  sessionId: string;
  date: string;
  topic: string | null;
  status: AttendanceStatusValue;
  observation: string | null;
};

export type StudentAttendanceSummary = {
  student: CourseOfferingStudent;
  counts: AttendanceCounts;
  totalMarked: number;
  attended: number;
  percentage: number | null;
  records: OfferingAttendanceRecord[];
};

export type AttendanceSessionData = {
  sessionId: string;
  records: AttendanceRecord[];
};

function createEmptyCounts(): AttendanceCounts {
  return {
    PRESENT: 0,
    ABSENT: 0,
    LATE: 0,
    JUSTIFIED: 0,
  };
}

export function buildOfferingAttendanceSummary(
  students: CourseOfferingStudent[],
  sessions: ClassSession[],
  attendanceBySession: AttendanceSessionData[]
): StudentAttendanceSummary[] {
  const sessionById = new Map(
    sessions.map((session): [string, ClassSession] => [session.id, session])
  );

  const summaries = students.map((student): StudentAttendanceSummary => {
    const counts = createEmptyCounts();
    const records: OfferingAttendanceRecord[] = [];

    for (const sessionAttendance of attendanceBySession) {
      const record = sessionAttendance.records.find(
        (entry) => entry.studentId === student.id
      );

      if (!record || !isAttendanceStatusValue(record.status)) {
        continue;
      }

      const session = sessionById.get(sessionAttendance.sessionId);

      if (!session) {
        continue;
      }

      counts[record.status] += 1;
      records.push({
        sessionId: sessionAttendance.sessionId,
        date: session.date,
        topic: session.topic ?? null,
        status: record.status,
        observation: record.observation ?? null,
      });
    }

    records.sort((first, second) => second.date.localeCompare(first.date));

    const totalMarked = records.length;
    const attended = counts.PRESENT + counts.LATE + counts.JUSTIFIED;
    const percentage =
      totalMarked > 0 ? Math.round((attended / totalMarked) * 100) : null;

    return {
      student,
      counts,
      totalMarked,
      attended,
      percentage,
      records,
    };
  });

  return summaries.sort((first, second) => {
    const lastNameOrder = first.student.lastName.localeCompare(
      second.student.lastName
    );

    if (lastNameOrder !== 0) {
      return lastNameOrder;
    }

    return first.student.firstName.localeCompare(second.student.firstName);
  });
}
