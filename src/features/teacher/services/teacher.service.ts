import type { AttendanceSessionData } from "@/features/attendance/attendance.summary";
import { apiRequest } from "@/lib/api/api.client";
import { getTodayIsoDate, toIsoDateOnly } from "@/lib/format/date";

import {
  BulkMarkAttendanceResponse,
  ClassSessionResponse,
  CourseOfferingStudentsResponse,
  CreateClassSessionInput,
  CreateClassSessionResponse,
  MarkAttendanceInput,
  ReopenClassSessionInput,
  SessionAttendanceResponse,
  TeacherClassSessionsResponse,
  TeacherCourseOfferingsResponse,
  TeacherProfileResponse,
  UpdateAttendanceInput,
  UpdateAttendanceResponse,
  UpdateClassSessionInput,
} from "../services/teacher.types";
import type { ClassSession, CourseOfferingStudent } from "./teacher.types";

export async function getMyCourseOfferings(
    token:string
): Promise<TeacherCourseOfferingsResponse> {
    return apiRequest<TeacherCourseOfferingsResponse>(
        "/teachers/me/course-offerings",
        {
            method: "GET",
            token,
        } 
    );
}

export async function getTeacherById(
  teacherProfileId: string,
  token: string
): Promise<TeacherProfileResponse> {
  return apiRequest<TeacherProfileResponse>(
    `/teachers/${teacherProfileId}`,
    {
      method: "GET",
      token,
    }
  );
}

export async function getCourseOfferingStudents(
  offeringId: string,
  token: string
): Promise<CourseOfferingStudentsResponse> {
  return apiRequest<CourseOfferingStudentsResponse>(
    `/course-offerings/${offeringId}/students`,
    {
      method: "GET",
      token,
    }
  );
}

export async function getCourseOfferingClassSessions(
  offeringId: string,
  token: string
): Promise<TeacherClassSessionsResponse> {
  return apiRequest<TeacherClassSessionsResponse>(
    `/course-offerings/${offeringId}/class-sessions`,
    {
      method: "GET",
      token,
    }
  );
}

export async function createClassSession(
  offeringId: string,
  input: CreateClassSessionInput,
  token: string
): Promise<CreateClassSessionResponse> {
  const trimmedNotes = input.notes?.trim() ?? "";

  return apiRequest<CreateClassSessionResponse>(
    `/course-offerings/${offeringId}/class-sessions`,
    {
      method: "POST",
      token,
      body: {
        date: input.date,
        topic: input.topic,
        ...(trimmedNotes ? { notes: trimmedNotes } : {}),
      },
    }
  );
}

export async function getClassSession(
  sessionId: string,
  token: string
): Promise<ClassSessionResponse> {
  return apiRequest<ClassSessionResponse>(`/class-sessions/${sessionId}`, {
    method: "GET",
    token,
  });
}

export async function updateClassSession(
  sessionId: string,
  input: UpdateClassSessionInput,
  token: string
): Promise<ClassSessionResponse> {
  const trimmedTopic = input.topic.trim();
  const trimmedNotes = input.notes?.trim() ?? "";

  return apiRequest<ClassSessionResponse>(`/class-sessions/${sessionId}`, {
    method: "PATCH",
    token,
    body: {
      topic: trimmedTopic,
      notes: trimmedNotes,
    },
  });
}

export async function closeClassSession(
  sessionId: string,
  token: string
): Promise<ClassSessionResponse> {
  return apiRequest<ClassSessionResponse>(`/class-sessions/${sessionId}/close`, {
    method: "PATCH",
    token,
  });
}

export async function reopenClassSession(
  sessionId: string,
  input: ReopenClassSessionInput,
  token: string
): Promise<ClassSessionResponse> {
  return apiRequest<ClassSessionResponse>(`/class-sessions/${sessionId}/reopen`, {
    method: "PATCH",
    token,
    body: { reason: input.reason.trim() },
  });
}

export async function getSessionAttendance(
  sessionId: string,
  token: string
): Promise<SessionAttendanceResponse> {
  return apiRequest<SessionAttendanceResponse>(
    `/class-sessions/${sessionId}/attendance`,
    {
      method: "GET",
      token,
    }
  );
}

export async function bulkMarkAttendance(
  sessionId: string,
  records: MarkAttendanceInput[],
  token: string
): Promise<BulkMarkAttendanceResponse> {
  return apiRequest<BulkMarkAttendanceResponse>(
    `/class-sessions/${sessionId}/attendance/bulk`,
    {
      method: "POST",
      token,
      body: { records },
    }
  );
}

export async function updateAttendance(
  recordId: string,
  input: UpdateAttendanceInput,
  token: string
): Promise<UpdateAttendanceResponse> {
  return apiRequest<UpdateAttendanceResponse>(`/attendance/${recordId}`, {
    method: "PATCH",
    token,
    body: input,
  });
}

export type OfferingAttendanceData = {
  students: CourseOfferingStudent[];
  sessions: ClassSession[];
  attendanceBySession: AttendanceSessionData[];
};

export async function getOfferingAttendanceData(
  offeringId: string,
  token: string
): Promise<OfferingAttendanceData> {
  const [studentsResponse, sessionsResponse] = await Promise.all([
    getCourseOfferingStudents(offeringId, token),
    getCourseOfferingClassSessions(offeringId, token),
  ]);

  const students = Array.isArray(studentsResponse.data)
    ? studentsResponse.data
    : [];

  const today = getTodayIsoDate();
  const sessions = (
    Array.isArray(sessionsResponse.data) ? sessionsResponse.data : []
  )
    .filter((session) => toIsoDateOnly(session.date) <= today)
    .sort((first, second) =>
      toIsoDateOnly(first.date).localeCompare(toIsoDateOnly(second.date))
    );

  const attendanceBySession = await Promise.all(
    sessions.map(async (session): Promise<AttendanceSessionData> => {
      const response = await getSessionAttendance(session.id, token);

      return {
        sessionId: session.id,
        records: Array.isArray(response.data) ? response.data : [],
      };
    })
  );

  return { students, sessions, attendanceBySession };
}
