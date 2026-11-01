export type AttendanceStatusValue =
  | "PRESENT"
  | "ABSENT"
  | "LATE"
  | "JUSTIFIED";

export type AttendanceStatusTone =
  | "present"
  | "absent"
  | "late"
  | "justified";

export type AttendanceStatusOption = {
  value: AttendanceStatusValue;
  label: string;
  tone: AttendanceStatusTone;
};

const ATTENDANCE_STATUS_LABELS = {
  PRESENT: "Presente",
  ABSENT: "Ausente",
  LATE: "Tarde",
  JUSTIFIED: "Justificado",
} as const satisfies Record<AttendanceStatusValue, string>;

const ATTENDANCE_STATUS_TONES = {
  PRESENT: "present",
  ABSENT: "absent",
  LATE: "late",
  JUSTIFIED: "justified",
} as const satisfies Record<AttendanceStatusValue, AttendanceStatusTone>;

const ATTENDANCE_STATUS_VALUES = [
  "PRESENT",
  "ABSENT",
  "LATE",
  "JUSTIFIED",
] as const satisfies readonly AttendanceStatusValue[];

export const ATTENDANCE_STATUS_OPTIONS: readonly AttendanceStatusOption[] =
  ATTENDANCE_STATUS_VALUES.map((value) => ({
    value,
    label: ATTENDANCE_STATUS_LABELS[value],
    tone: ATTENDANCE_STATUS_TONES[value],
  }));

export function isAttendanceStatusValue(
  value: unknown
): value is AttendanceStatusValue {
  return ATTENDANCE_STATUS_OPTIONS.some((option) => option.value === value);
}

export function getAttendanceStatusLabel(status: unknown): string {
  return isAttendanceStatusValue(status)
    ? ATTENDANCE_STATUS_LABELS[status]
    : "Sin estado";
}

export function getAttendanceStatusTone(
  status: unknown
): AttendanceStatusTone | "neutral" {
  return isAttendanceStatusValue(status)
    ? ATTENDANCE_STATUS_TONES[status]
    : "neutral";
}
