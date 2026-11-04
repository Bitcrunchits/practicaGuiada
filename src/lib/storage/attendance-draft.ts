import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AttendanceStatusValue } from "@/features/attendance/attendance.types";
import { isAttendanceStatusValue } from "@/features/attendance/attendance.types";

const STORAGE_PREFIX = "attendance:draft";

type AttendanceDraftEntry = {
  studentId: string;
  status: AttendanceStatusValue;
  observation?: string | null;
  lastModifiedAt: string;
};

type AttendanceDraft = Record<string, AttendanceDraftEntry>;

type AttendanceDraftScope = {
  teacherId: string;
  courseOfferingId: string;
  sessionId: string;
};

type AttendanceDraftStorage = {
  saveDraft: (scope: AttendanceDraftScope, draft: AttendanceDraft) => Promise<void>;
  getDraft: (scope: AttendanceDraftScope) => Promise<AttendanceDraft | null>;
  updateDraft: (
    scope: AttendanceDraftScope,
    studentId: string,
    entry: AttendanceDraftEntry
  ) => Promise<AttendanceDraft>;
  deleteConfirmedDraft: (scope: AttendanceDraftScope) => Promise<void>;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isValidDraftEntry(value: unknown): value is AttendanceDraftEntry {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;

  const entry = value as Record<string, unknown>;
  return (
    isNonEmptyString(entry.studentId) &&
    isAttendanceStatusValue(entry.status) &&
    (entry.observation === undefined || entry.observation === null || typeof entry.observation === "string") &&
    isNonEmptyString(entry.lastModifiedAt)
  );
}

function isValidDraft(value: unknown): value is AttendanceDraft {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;

  return Object.values(value as Record<string, unknown>).every(isValidDraftEntry);
}

function validateScope(scope: AttendanceDraftScope): void {
  if (!isNonEmptyString(scope.teacherId)) {
    throw new Error("attendance-draft: teacherId is required");
  }
  if (!isNonEmptyString(scope.courseOfferingId)) {
    throw new Error("attendance-draft: courseOfferingId is required");
  }
  if (!isNonEmptyString(scope.sessionId)) {
    throw new Error("attendance-draft: sessionId is required");
  }
}

function buildDraftKey(scope: AttendanceDraftScope): string {
  validateScope(scope);
  return `${STORAGE_PREFIX}:${scope.teacherId}:${scope.courseOfferingId}:${scope.sessionId}`;
}

async function saveDraft(scope: AttendanceDraftScope, draft: AttendanceDraft): Promise<void> {
  if (!isValidDraft(draft)) {
    throw new Error(
      "attendance-draft: draft must only contain entries with studentId, status and lastModifiedAt"
    );
  }
  await AsyncStorage.setItem(buildDraftKey(scope), JSON.stringify(draft));
}

async function getDraft(scope: AttendanceDraftScope): Promise<AttendanceDraft | null> {
  const raw = await AsyncStorage.getItem(buildDraftKey(scope));
  if (raw === null) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  return isValidDraft(parsed) ? parsed : null;
}

async function updateDraft(
  scope: AttendanceDraftScope,
  studentId: string,
  entry: AttendanceDraftEntry
): Promise<AttendanceDraft> {
  if (!isNonEmptyString(studentId)) {
    throw new Error("attendance-draft: studentId is required");
  }
  if (!isValidDraftEntry(entry)) {
    throw new Error("attendance-draft: invalid draft entry");
  }

  const current = (await getDraft(scope)) ?? {};
  const next: AttendanceDraft = { ...current, [studentId]: entry };
  await AsyncStorage.setItem(buildDraftKey(scope), JSON.stringify(next));
  return next;
}

async function deleteConfirmedDraft(scope: AttendanceDraftScope): Promise<void> {
  await AsyncStorage.removeItem(buildDraftKey(scope));
}

const attendanceDraftStorage: AttendanceDraftStorage = {
  saveDraft,
  getDraft,
  updateDraft,
  deleteConfirmedDraft,
};

export default attendanceDraftStorage;

export { saveDraft, getDraft, updateDraft, deleteConfirmedDraft };
export type { AttendanceDraft, AttendanceDraftEntry, AttendanceDraftScope, AttendanceDraftStorage };
