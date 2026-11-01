# Student enrollments and attendance

## Objective

Give the student a real view of the course offerings they are enrolled in and their attendance
per subject, connected to the live backend.

## Problem

- The student home has an "Inscripciones" card with no destination.
- The career/year/subject path reads `/students/me/study-plan`, which lists plan subjects, not
  real enrollments.
- The attendance screen only shows totals and the count of records; the API records are typed as
  `unknown[]` and are never rendered.
- API failures on the student screens are logged and then shown as an empty state.

## Why

The practice requires the student to see the subjects they are actually enrolled in and their
attendance in each one. The plan explicitly says plan subjects are not necessarily enrolled
subjects.

## Scope

In scope:

- New `student/enrollments` screen using `GET /students/me/enrollments` (active only).
- Wire the "Inscripciones" card on the student home.
- Attendance screen: real record history with date, status, topic, and observation; totals;
  explicit loading/error/empty states with retry; subject context passed from navigation.
- Shared attendance status type/labels with the teacher flow.
- Defensive typing/normalization for the attendance records, because the OpenAPI declares
  `records` as a generic object with "classSession + courseOffering" description.

Out of scope:

- Rewriting the study-plan path; it stays as a secondary view ("Mis carreras" → plan).
- Student profile and exam boards screens (cards stay muted).
- Enrollment mutation (drop/enroll) from the app.
- Check-in / QR.

## API contract (verified against the live OpenAPI at `/docs-json`)

`GET /students/me/enrollments?includeHistory=false`

- Success `200`: `{ success: true; data: EnrollmentResponseDto[]; timestamp }`.
- `EnrollmentResponseDto`: `id`, `courseOfferingId`, `studentId`, `status`
  (`ACTIVE | DROPPED | COMPLETED | VOID`), `condition`, `enrolledAt`, plus optional
  `courseOffering` (`CourseOfferingResponseDto` with nested `subject`, `academicYear`,
  `teacher`).
- Default excludes `DROPPED`/`COMPLETED`; the app uses the default.

`GET /students/me/attendance?courseOfferingId={id}`

- Success `200`: `{ success: true; data: { totals, records }; timestamp }`.
- `totals`: `{ PRESENT, ABSENT, LATE, JUSTIFIED }`.
- `records`: untyped in the spec; described as "Attendance records with classSession +
  courseOffering". The app reads `status`, `observation`, a session date/topic from
  `classSession`/`session`/`date`, and tolerates missing fields without crashing.

## Design decisions

- The enrollment list is the primary "materias inscriptas" view. Each card navigates directly to
  that offering's attendance screen with `careerId`, `year`, `subjectId`, `courseOfferingId`,
  and `subjectName`.
- "Mis carreras" stays as the study-plan browser; its subtitle becomes "Plan de estudios" to
  avoid confusing it with real enrollments.
- The attendance screen is migrated to `Screen` + `AppScreenHeader` + `AppCard` +
  `StatusBadge` for consistency with the current visual system.
- Records are sorted newest first when a parseable date exists; original API order is preserved
  otherwise.
- Unknown statuses render as a neutral "Sin estado" badge, never crash.

## Tasks

- [ ] SA-1 Add `getMyEnrollments(token)` and enrollment types.
- [ ] SA-2 Build `student/enrollments/index.tsx` with loading, error+retry, empty, and list.
- [ ] SA-3 Wire the student home "Inscripciones" card and clarify "Mis carreras".
- [ ] SA-4 Type and normalize attendance records; rewrite the attendance screen with history,
  totals, retry, empty state, and subject context.
- [ ] SA-5 Verify: `npx tsc --noEmit`, `git diff --check`, route/bundle check, readback.

## Route

| Task | Route | Trigger evidence |
| --- | --- | --- |
| SA-1..SA-4 | Delegated writer | Four non-trivial files plus a screen rewrite; writer trigger. |
| SA-5 | Parent | Read-only verification and structural readback. |

## Acceptance criteria

- The student home "Inscripciones" card opens the enrollment list.
- The enrollment list shows only active enrollments, with subject, commission, academic year,
  and teacher when available.
- An enrollment card opens attendance for that course offering.
- The attendance screen shows subject context, totals, and a real per-record history with date,
  status, topic, and observation when present.
- Loading, error with retry, empty, and success are distinct.
- `npx tsc --noEmit` exits 0. No new dependency.

## Review workload forecast

- Estimated authored changed lines: 450-600 (service/types, new ~220-line screen, ~250-line
  attendance rewrite, home tweak).
- Above the 400-line heuristic. No commit or PR is requested in this session; recorded for the
  eventual delivery decision.

## Files

- `src/features/student/student.types.ts`
- `src/features/student/services/student.service.ts`
- `src/app/(private)/student/enrollments/index.tsx` (new)
- `src/app/(private)/student/index.tsx`
- `src/app/(private)/student/careers/[careerId]/[year]/[subjectId]/attendance/index.tsx`
- `src/features/attendance/attendance.types.ts`
- `src/lib/format/date.ts`

## Progress

- 2026-10-31: Scope authorized by the user as part of the complete attendance circuit.
