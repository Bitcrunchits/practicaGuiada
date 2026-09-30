import { apiRequest } from "@/lib/api/api.client";

import { StudentStudyPlanResponse,
    StudentSubjectDetailResponse,
    StudentAttendanceResponse,
 } from "../student.types";

export async function getMyStudyPlan(
  token: string
): Promise<StudentStudyPlanResponse> {
  return apiRequest<StudentStudyPlanResponse>(
    "/students/me/study-plan",
    {
      method: "GET",
      token,
    }
  );
}

export async function getMySubject(
  subjectId: string,
  token: string
): Promise<StudentSubjectDetailResponse> {
  return apiRequest<StudentSubjectDetailResponse>(
    `/students/me/subjects/${subjectId}`,
    {
      method: "GET",
      token,
    }
  );
}

export async function getMyAttendance(
  courseOfferingId: string,
  token: string
): Promise<StudentAttendanceResponse> {
  return apiRequest<StudentAttendanceResponse>(
    `/students/me/attendance?courseOfferingId=${courseOfferingId}`,
    {
      method: "GET",
      token,
    }
  );
}