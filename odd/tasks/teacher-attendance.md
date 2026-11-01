# Teacher attendance flow

## Objective

Give the teacher a real attendance workflow in the mobile app: see assigned course offerings,
see the students enrolled in each one, create the class session for a date, register
attendance, and review history.

## Problem

`teacher/attendance/[offeringId].tsx` was a static placeholder; the app could not show enrolled
students. The offerings list masked API failures as an empty state. Without class sessions there
is no anchor for attendance records.

## Why

The practice's core flow needs the teacher to open the class of the day before marking
attendance. This document tracks the flow phase by phase.

## Scope boundaries

- Out for Phase 2: attendance marking, bulk save, close/reopen session, check-in window, QR,
  history, corrections, student flow, role guard.
- No new dependencies, no mock data, no navigation restructuring.
- Do not commit. Do not touch `.atl/`, `.vscode/`, or `docs/`.

---

# Phase 1 — students of a course offering (done)

## API contract

`GET /course-offerings/{id}/students`

- Auth: Bearer JWT. Success `200` with `{ success: true; data: StudentResponseDto[]; timestamp }`.
- No pagination. Errors `401`, `403`, `404`.
- `StudentResponseDto` required: `id`, `firstName`, `lastName`, `documentNumber`,
  `studentNumber`, `isActive`, `createdAt`, `updatedAt`. Optional, `string | null`: `userId`,
  `phone`, `email`, `birthDate`, `deletedAt`.
- `id` is the StudentProfile id and the future `MarkAttendanceDto.studentId`. Use it as the key.

## Tasks

- [x] TA-1 Add `CourseOfferingStudent` and `CourseOfferingStudentsResponse`.
- [x] TA-2 Add `getCourseOfferingStudents(offeringId, token)`.
- [x] TA-3 Replace the static detail screen with loading/success/empty/error, retry,
      cancellation, and student rows.
- [x] TA-4 Harden `attendance.tsx`: explicit error state, missing-token handling, display context.
- [x] TA-5 Verify: `npx tsc --noEmit` exit 0; structural readback. Manual flow pending by user.

## Progress

- 2026-10-29: TA-1..TA-4 implemented and verified. Diff: 312 insertions + 72 deletions = 384.
- 2026-10-29: Native RDD review unavailable in this runtime
  (`immutable_review_transport_unsupported`); no PASS was invented.
- Known gap: `attendance.tsx` retains its pre-existing plain header; aligning it to
  `Screen`/`AppScreenHeader` remains a visual follow-up.

---

# Phase 2 — class sessions (plan item 3) — IN PROGRESS

## Objective

List the class sessions of a course offering and create a new one for a date, from the offering
detail screen, so attendance can later be marked against a real session.

## API contract (verified against the live OpenAPI at `/docs-json`)

`GET /course-offerings/{id}/class-sessions`

- Auth: Bearer JWT. No query params, no pagination. Ordered chronologically.
- Success `200`: `{ success: true; data: ClassSessionResponseDto[]; timestamp }`.
- Errors: `401`, `403`, `404`.

`POST /course-offerings/{id}/class-sessions`

- Success `201`: `{ success: true; data: ClassSessionResponseDto; timestamp }`.
- Errors: `400` (validation/business rule), `401`, `403`, `404`,
  `409` (unique constraint — duplicate session for the same date).

`CreateClassSessionDto`

- Required: `date` (`YYYY-MM-DD`), `topic` (string, book of topics).
- Optional: `notes`, `format` (`THEORY | PRACTICE | THEORY_PRACTICE`, default
  `THEORY_PRACTICE`), `modality` (`IN_PERSON | VIRTUAL`, default `IN_PERSON`),
  `evaluationId`, `programUnitId`.
- `dictatedByTeacherId` and `onBehalfReason` are **secretaría-only**. A teacher must never send
  them.

`ClassSessionResponseDto`

- Required: `id`, `courseOfferingId`, `date`, `status`, `createdByTeacherId`, `createdAt`,
  `updatedAt`.
- `status`: `OPEN | CLOSED`.
- `topic` and `notes` are declared as nullable `object` artifacts in the spec; model them as
  `string | null` and render defensively.

## Design decisions

- Extend the existing offering detail screen instead of adding a route. The teacher opens a
  cursada and sees sessions (top) and students (bottom).
- Session creation is an inline form card toggled by a button. No modal, no new dependency, no
  date picker (none installed).
- Send only `date`, `topic`, and `notes`. `format`/`modality` keep the server defaults; they are
  a later slice.
- `apiRequest` currently throws a plain `Error` with no status, so `409` cannot be distinguished.
  Add a minimal `ApiError` carrying `status`; existing `instanceof Error` consumers stay
  compatible.
- No date library exists in the repo. Add a local `formatSessionDate` helper (ISO → `dd/mm/yyyy`)
  and a local `getTodayIsoDate` using local time, not `toISOString` (UTC shift risk).

## Tasks

- [x] TA-10 Add `ClassSessionStatus`, `ClassSession`, `TeacherClassSessionsResponse`,
      `CreateClassSessionInput`, `CreateClassSessionResponse` to
      `src/features/teacher/services/teacher.types.ts`.
- [x] TA-11 Add `getCourseOfferingClassSessions(offeringId, token)` and
      `createClassSession(offeringId, input, token)` to
      `src/features/teacher/services/teacher.service.ts`.
- [x] TA-12 Add `ApiError` with `status` in `src/lib/api/api.client.ts`, thrown on non-ok
      responses.
- [x] TA-13 Add the sessions section to
      `src/app/(private)/teacher/attendance/[offeringId].tsx`: independent
      loading/success/empty/error state with retry, chronological list with date + topic +
      status badge, "Nueva clase" toggle, inline create form (date, topic, notes), per-field
      validation, submit with loading state, `409` message, list refresh on success.
- [x] TA-14 Verify: `npx tsc --noEmit` exit 0; `git diff --check`; structural readback.

## Route

| Task | Route | Trigger evidence |
| --- | --- | --- |
| TA-10..TA-13 | Delegated writer | Three non-trivial files plus a screen extension; writer trigger. |
| TA-14 | Parent | Read-only verification and structural readback. |

## Review workload forecast

- Estimated authored changed lines: 280–340.
- Actual: ~490 authored added lines (types +32, service +36, client +9, screen +410 plus
  parent fixes). **Above the 400-line heuristic.**
- Chained PRs recommended: No — no commit or PR is being created in this slice; the overage is
  recorded for the delivery decision when the branch is committed.
- Delivery strategy: `ask-on-risk`; the split decision moves to the first commit of this range.

## Acceptance criteria

- The detail screen shows the offering's sessions, ordered as the API returns them.
- Each row shows the date as `dd/mm/yyyy`, the topic (fallback `Sin tema registrado`), and a
  badge with `Abierta` / `Cerrada`.
- An offering with no sessions shows an explicit empty state, distinct from loading and error.
- A sessions fetch failure shows an explicit error and a retry action.
- "Nueva clase" opens an inline form with date (prefilled with today's local date), topic, and
  notes.
- An invalid date or an empty topic blocks submission with a per-field message.
- A successful create closes the form, resets the fields, and refreshes the list.
- A `409` shows "Ya existe una clase registrada para esa fecha en esta cursada."
- The teacher never sends `dictatedByTeacherId` or `onBehalfReason`.
- Missing token and missing `offeringId` stay recoverable, not a crash.
- Existing students section keeps working.
- `npx tsc --noEmit` exits 0. No new dependency. No unrelated changes.

## Checks

- `npx tsc --noEmit` — passed, exit 0 (writer and parent, twice: before and after the parent
  fixes).
- `git diff --check` — passed, exit 0, no whitespace errors.
- Manual: teacher → cursada → crear clase → ver en la lista → duplicado (409) — pending by user.

## Files

- `src/features/teacher/services/teacher.types.ts`
- `src/features/teacher/services/teacher.service.ts`
- `src/lib/api/api.client.ts`
- `src/app/(private)/teacher/attendance/[offeringId].tsx`

## Progress

- 2026-10-30: Phase 2 authorized by the user ("ok continuemos con eso").
- 2026-10-30: Contract verified against the live OpenAPI; UI components mapped.
- 2026-10-30: Writer implemented TA-10..TA-13 and reported `npx tsc --noEmit` exit 0.
- 2026-10-30: Parent structural readback. Fixed three cohesion/robustness issues: the screen
  title now reflects that it holds classes and students (`Detalle de la cursada`), the students
  block regained a visible `Alumnos` section header, and `formatSessionDate` no longer returns a
  non-string date value. Parent re-ran `npx tsc --noEmit` and `git diff --check`; both exit 0.
- Known follow-up: the screen is now ~645 lines and duplicates two nearly identical
  fetch/loading/error state machines (`students` and `sessions`). Before Phase 3, extract
  `useClassSessions` (or a shared async-resource hook) and a `ClassSessionsSection` component.
  This is a maintainability fix, not a behavior change.
- 2026-10-30: RDD preflight produced a high-risk consent envelope for the workspace candidate
  (26 files, 2549 changed lines, risk evidence: authentication in LoginForm.tsx). The user
  declined review for this candidate. No review record or lineage was created; delivery follows
  ordinary repository policy and the next candidate asks again.

---

# Phase 3 — take and save attendance (plan items 5-6) — IN PROGRESS

## Objective

From a class session, show the enrolled students, let the teacher mark `PRESENT`, `ABSENT`,
`LATE`, or `JUSTIFIED` for each one, save the result to the backend, and read the saved records
back.

## API contract (verified against the live OpenAPI at `/docs-json`)

`GET /class-sessions/{id}` → `ClassSessionResponseDto` (`courseOfferingId`, `date`, `topic`,
`status`, ...).

`GET /class-sessions/{id}/attendance`

- Success `200`: `{ success: true; data: AttendanceRecordResponseDto[]; timestamp }`.
- `AttendanceRecordResponseDto`: `id`, `classSessionId`, `studentId`, `status`,
  `observation?` (nullable object in the spec, handled as `string | null`), `markedAt`,
  `markedByTeacherId`, `createdAt`, `updatedAt`, `student?`
  (`AttendanceStudentBriefDto`: `id`, `firstName`, `lastName`, `studentNumber?`,
  `documentNumber?`).

`POST /class-sessions/{id}/attendance/bulk`

- Body `{ records: MarkAttendanceDto[] }`; `MarkAttendanceDto`: `studentId` (StudentProfile id),
  `status`, optional `observation`.
- Success `201`: saved `AttendanceRecordResponseDto[]`.
- Errors: `400`, `401`, `403`, `404`.

`POST /class-sessions/{id}/attendance` marks one student (single-record variant).

`PATCH /attendance/{id}`

- Body `{ status?, observation? }`; success `200` with the updated record.
- Used for corrections of already-saved records.

`PATCH /class-sessions/{id}/close` and `/reopen` exist but are out of scope for this slice.

## Design decisions

- New route `teacher/attendance/session/[sessionId]` instead of growing the 645-line offering
  detail screen. The offering detail only gains an `onPress` navigation on each session card.
- The screen loads the session, then students + attendance in parallel. States are explicit:
  loading, error with retry, success.
- Local per-student selection initialized from saved records. Quick action "Marcar todos
  presentes" sets every student to `PRESENT`; the teacher adjusts exceptions before saving.
- Save strategy: new records go through the bulk endpoint; changed existing records go through
  `PATCH /attendance/{id}` one by one. Unchanged rows are not sent.
- A closed session renders read-only: no selection changes, no save button, explicit notice.
- No observation editing in this slice. Existing observations are displayed when present.
- No new dependency, no mock data, no close/reopen, no QR/check-in.

## Tasks

- [ ] TA-20 Add shared attendance status type/labels (teacher + student).
- [ ] TA-21 Add `ClassSessionResponse`, `AttendanceRecord`, `SessionAttendanceResponse`,
  `MarkAttendanceInput`, `BulkMarkAttendanceResponse`, `UpdateAttendanceResponse`.
- [ ] TA-22 Add `getClassSession`, `getSessionAttendance`, `bulkMarkAttendance`,
  `updateAttendance` to the teacher service.
- [ ] TA-23 Add `PATCH` to the HTTP client method union.
- [ ] TA-24 Build the session attendance screen with merge, selection, quick action, save,
  success/error feedback, retry, and read-only closed state.
- [ ] TA-25 Make session cards in the offering detail navigate to the new screen.
- [ ] TA-26 Add role guards for teacher/student/admin route trees.
- [ ] TA-27 Verify: `npx tsc --noEmit`, `git diff --check`, route/bundle check, readback.

## Route

| Task | Route | Trigger evidence |
| --- | --- | --- |
| TA-20..TA-25 | Delegated writer | Six non-trivial files plus a new screen; writer trigger. |
| TA-26 | Delegated writer / parent | Three tiny layout files; writer trigger if bundled with TA-20..TA-25. |
| TA-27 | Parent | Read-only verification and structural readback. |

## Acceptance criteria

- A session card opens the session attendance screen with date, topic, and subject context.
- The screen shows every enrolled student with their saved status, or an unmarked state.
- The teacher can set each of the four states and use "Marcar todos presentes".
- Saving sends only marked students, uses bulk for new records and PATCH for corrections, and
  prevents duplicate submits.
- A successful save refreshes the records and shows a success message.
- A failed save shows an actionable error and does not silently discard the selection.
- A closed session is read-only.
- Empty students and empty records are explicit states, not errors.
- `npx tsc --noEmit` exits 0. No new dependency.

## Review workload forecast

- Estimated authored changed lines: 550-700 for the teacher slice (shared types/date helper,
  service/types, new ~350-line screen, navigation, guards).
- Above the 400-line heuristic. No commit or PR is requested in this session; the boundary is
  recorded for the eventual delivery decision.

## Files

- `src/features/attendance/attendance.types.ts` (new)
- `src/lib/format/date.ts` (new)
- `src/lib/api/api.client.ts`
- `src/features/teacher/services/teacher.types.ts`
- `src/features/teacher/services/teacher.service.ts`
- `src/app/(private)/teacher/attendance/session/[sessionId].tsx` (new)
- `src/app/(private)/teacher/attendance/[offeringId].tsx`
- `src/app/(private)/teacher/_layout.tsx` (new)
- `src/app/(private)/student/_layout.tsx` (new)
- `src/app/(private)/admin/_layout.tsx` (new)

---

# Student flow — see `odd/tasks/student-attendance.md`
