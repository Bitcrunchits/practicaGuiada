import { apiRequest } from "@/lib/api/api.client";

import { TeacherCourseOfferingsResponse, TeacherProfileResponse } from "../services/teacher.types";

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