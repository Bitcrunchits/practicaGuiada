# Teacher flow — class book and attendance

## Objective

Restructure the teacher experience into the flow the user specified:

1. Home: "Ver mis cursadas" and "Mi perfil" buttons at the top. Logout only on this screen, at the bottom.
2. Cursadas list: the teacher selects an assigned course offering.
3. Offering hub: adaptive "Clase de hoy" card (create when empty; attendance, edit, close,
   or reopen when present) plus "Alumnos inscriptos", "Consultar clases", and
   "Consultar asistencias".
4. Creating, editing, attendance, and consultations open dedicated screens; close and reopen
   use inline confirmation. Attendance marks `PRESENT`, `ABSENT`, `LATE`, or `JUSTIFIED` per
   student and saves to the backend.
5. From the second screen onward, a bottom "Volver" button.

## Problem

- The home uses two cards instead of the requested top buttons.
- The cursadas list does not use the current visual system (`Screen`, `AppScreenHeader`,
  `AppCard`); it hand-rolls its header and cards.
- `teacher/attendance/[offeringId].tsx` is a 610-line monolith that mixes classes, the create
  form, and students.
- There are no dedicated screens for creating a class, today's attendance, enrolled students,
  class history, or attendance consultation.
- The profile screen hand-rolls its header and cards and does not match the visual system.
- There is no teacher-side attendance percentage or per-student history.

## Decisions (user-confirmed)

- A **class** is the topic of the day, not the course. The **cursada** is the course with its
  enrolled students.
- "Asistencia" targets **today's class**. If no class exists for today, the screen offers to
  create it.
- "Consultar clases" shows the **history of previous classes**.
- "Consultar asistencias" shows **every student's attendance percentage up to today**, plus a
  button per student to open a **per-day history** of when they attended or missed.
- Percentage counts `PRESENT + LATE + JUSTIFIED` as attended; only `ABSENT` lowers it.
- Every screen must reuse the visual pattern of "Detalle de la cursada": navy header, square
  white cards, 1px ink borders, section titles, `AppButton` actions, `StatusBadge`, `Skeleton`,
  `FeedbackState`, theme tokens only. No shadows. Spanish UI copy, neutral register.

## Out of scope

- Student screens, admin/ACADEMIC screens, and role-guard changes.
- Deleting classes, QR/check-in, and the `format`/`modality`/`evaluationId`/`programUnitId`
  fields of the class PATCH.
- Per-record observation editing from the teacher flow.
- New dependencies.
- PRs. The user later authorized committing and pushing the complete guided-practice worktree.

## Contract (verified live, 2026-11-01)

- `PATCH /class-sessions/{id}` — update topic/notes; roles `TEACHER | ADMIN | ACADEMIC`;
  body `topic`, `notes`, `format`, `modality`, `evaluationId`, `programUnitId`; works with
  `OPEN` or `CLOSED`.
- `PATCH /class-sessions/{id}/close` — close; `TEACHER` requires a topic loaded; also closes
  the check-in window.
- `PATCH /class-sessions/{id}/reopen` — reopen; body `reason`; `TEACHER` only until the day
  after the class date; `409` if already open; audited.
- `PATCH /course-offerings/{id}` is `ADMIN | ACADEMIC` only and updates the offering, not the
  class session.

## Tasks

- [x] TF-1 Add an optional `footer` slot to `Screen` and a reusable `ScreenFooter` component
      with a secondary "Volver" button.
- [x] TF-2 Rewrite the teacher home: "Ver mis cursadas" + "Mi perfil" buttons at the top;
      logout only here, at the bottom.
- [x] TF-3 Rewrite the cursadas list with `Screen` + `AppScreenHeader` + pressable `AppCard`s
      + loading/error/empty states + bottom back.
- [x] TF-4 Rewrite the teacher profile with `Screen` + `AppScreenHeader` + `AppCard` sections
      + `FeedbackState` + bottom back; no logout.
- [x] TF-5 Replace `teacher/attendance/[offeringId].tsx` with
      `teacher/attendance/[offeringId]/index.tsx` as the offering hub: sections "Clase de hoy"
      (crear clase, asistencia) and "Consulta" (alumnos, clases, asistencias) + bottom back.
- [x] TF-6 Add `create-session.tsx`: date prefilled with today (editable), topic required,
      notes optional, validation, POST, 409 message, success feedback, bottom back.
- [x] TF-7 (historical; superseded by TF-19) Added `today-attendance.tsx`: load sessions,
      find today's session and replace into the existing session attendance screen; if none,
      show an empty state with a create button. TF-19 later removed this route.
- [x] TF-8 Add `students.tsx`: enrolled students list with loading/error/empty/retry and
      bottom back.
- [x] TF-9 Add `sessions.tsx`: class history, newest first, with date, topic, status, notes,
      and bottom back.
- [x] TF-10 Add the attendance aggregation helper and a composite service call that loads
      students, sessions up to today, and each session's attendance.
- [x] TF-11 Add `attendance-summary.tsx`: per-student percentage (PRESENT+LATE+JUSTIFIED),
      counts, "Ver historial" button per student, loading/error/empty, bottom back.
- [x] TF-12 Add `student-attendance/[studentId].tsx`: per-student percentage, counts, and
      per-day records with date, status badge, topic, and observation; bottom back.
- [x] TF-13 Add the bottom back footer to `attendance/session/[sessionId].tsx` in every state
      and remove duplicated inline "Volver" buttons.
- [x] TF-14 Verify: `npx tsc --noEmit` exit 0, `git diff --check`, route/bundle check,
      structural readback.
- [x] TF-15 Add `toIsoDateOnly` to `src/lib/format/date.ts` and use it in the hub and
      `getOfferingAttendanceData` so full ISO timestamps match today.
- [x] TF-16 Add `UpdateClassSessionInput`, `ReopenClassSessionInput`, and service functions
      `updateClassSession`, `closeClassSession`, `reopenClassSession` for the three verified
      PATCH endpoints.
- [x] TF-17 Rewrite the hub "Clase de hoy" as an adaptive card: loading, error+retry, no-class
      create state, OPEN state with attendance/edit/close, CLOSED state with read-only
      attendance/edit/reopen, inline close confirmation and reopen reason form. Remove the
      separate "Asistencia de hoy" button.
- [x] TF-18 Add `edit-session.tsx` with date read-only, topic required, notes optional, PATCH,
      loading/error/success, bottom back.
- [x] TF-19 Delete `today-attendance.tsx` and its route references; the hub passes `sessionId`
      directly to the session attendance screen.
- [x] TF-20 Verify: `npx tsc --noEmit`, `git diff --check`, web bundle, structural readback;
      update this document.

## Route

| Task | Route | Trigger evidence |
| --- | --- | --- |
| TF-1..TF-4 | Delegated writer | Five non-trivial files plus a shared layout change; writer trigger. |
| TF-5..TF-9 | Delegated writer | New route tree and five screens; writer trigger. |
| TF-10..TF-13 | Delegated writer | Service, aggregation helper, two new screens, and a session-screen change; writer trigger. |
| TF-14 | Parent | Read-only verification and structural readback. |
| TF-15..TF-19 | Delegated writer | Hub rewrite, new edit screen, service/types, date helper, route deletion; writer trigger. |
| TF-20 | Parent | Read-only verification and structural readback. |

## Acceptance criteria

- Home shows "Ver mis cursadas" and "Mi perfil" at the top and logout only at the bottom.
- Every screen from the cursadas list onward has a visible bottom "Volver" button that works
  in loading, error, empty, and success states.
- The cursadas list uses the same visual pattern as "Detalle de la cursada" and opens the hub.
- The hub shows an adaptive "Clase de hoy" card and three actions grouped under "Consulta".
- "Crear clase del día" creates a class with date, topic, and notes; duplicate date shows the
  409 message; success is visible.
- The hub opens today's session attendance directly by `sessionId`; if no class exists,
  the card offers to create one.
- "Alumnos inscriptos" lists every enrolled student.
- "Consultar clases" lists the class history newest first.
- "Consultar asistencias" lists every student with percentage and counts; each student has a
  button to open their per-day history.
- Percentage uses `PRESENT + LATE + JUSTIFIED` over marked records up to today.
- The session attendance screen still marks the four states and saves through bulk + PATCH.
- No hardcoded colors outside the theme; no new dependency; `npx tsc --noEmit` exits 0.
- Hub "Clase de hoy" is adaptive: no class → create; OPEN → take attendance/edit/close;
  CLOSED → view attendance/edit/reopen.
- The separate "Asistencia de hoy" button and `today-attendance` route are removed.
- Editing updates topic/notes via `PATCH /class-sessions/{id}`; close/reopen use their PATCH
  endpoints with confirmation/reason.
- Date comparisons normalize full ISO timestamps to `YYYY-MM-DD`.

## Checks

- TF-14 checks (before TF-15..TF-19): `npx tsc --noEmit` and `git diff --check` passed,
  exit 0.
- TF-14 web bundle check (before TF-15..TF-19): `npx expo export --platform web` passed,
  exit 0, 833 modules. The iteration 2 export is recorded separately below.
- Local hub correction: `npx tsc --noEmit --incremental false`, `git diff --check`, and
  `git diff --cached --check` passed (exit 0); both untracked files passed
  `git diff --no-index --check`.
- TF-20 independent checks after correction: `npx tsc --noEmit --incremental false`,
  `git diff --check`, and `git diff --cached --check` passed (exit 0).
  `npx expo export --platform web --output-dir /tmp/opencode/pracguiada-web` passed
  (exit 0, 833 modules). Source readback confirmed the adaptive hub, edit route,
  PATCH services, date normalization, and no `today-attendance` source references.
- No automated test script is configured in `package.json`; live API/device behavior
  and the delayed-GET-versus-close/reopen scenario remain untested on a device.
- Native RDD review is still pending: the worktree includes unrelated tracked and
  untracked changes. Risk assessment returned `high/unassessable` until intended
  untracked files are selected. Read-only preflight requested that selection; no
  review START, consent choice, or approval was completed.
- Manual teacher flow on device — pending by user.

## Progress

- 2026-11-01: User authorized the teacher flow and answered the product questions:
  class = topic of the day, attendance = today, class history = previous classes,
  attendance consultation = percentage per student + per-day detail, percentage counts
  PRESENT + LATE + JUSTIFIED. Plan created.
- 2026-11-01: TF-1..TF-4 implemented and verified (`npx tsc --noEmit` exit 0).
- 2026-11-01: TF-5..TF-9 implemented; the old `[offeringId].tsx` was replaced by the
  folder hub plus create-session, today-attendance, students, and sessions screens.
- 2026-11-01: TF-10..TF-13 implemented; attendance aggregation counts
  PRESENT + LATE + JUSTIFIED over marked records up to today.
- 2026-11-01: Added "Tomar asistencia" after creating a class and defensive
  legajo/DNI subtitles. `npx tsc --noEmit` exit 0.
- 2026-11-01: TF-14 web bundle check passed before iteration 2. Manual device test
  pending by user.
- 2026-11-01: Iteration 2 implemented (TF-15..TF-19): adaptive "Clase de hoy" hub with
  create/take/edit/close/reopen, new `edit-session` screen, class PATCH service functions,
  ISO date normalization, and `today-attendance` removal. `npx tsc --noEmit` exit 0;
  `git diff --check` exit 0. Final verification is recorded in TF-20.
- 2026-11-01: Invalidated in-flight hub class GETs on blur and around close/reopen PATCH
  responses so stale data cannot replace the returned session status or success feedback.
- 2026-11-01: TF-20 independent typecheck, diff checks, web export, and structural
  readback passed; manual device/backend validation remains pending.
- 2026-11-01: Work-unit commit `1d4c724bb8f89db9b60f87968b18fefcd3580438`
  on `feat/practica-guiada-flujos` includes the full user-authorized guided-practice
  worktree (teacher, student, shared UI, configuration, and docs). Rollback boundary:
  revert this commit to restore the prior app state; native review and device validation
  remain pending.

## Files

- `src/components/ui/Screen.tsx`
- `src/components/ui/ScreenFooter.tsx` (new)
- `src/app/(private)/teacher/index.tsx`
- `src/app/(private)/teacher/attendance.tsx`
- `src/app/(private)/teacher/profile.tsx`
- `src/app/(private)/teacher/attendance/[offeringId]/index.tsx` (moved/rewritten)
- `src/app/(private)/teacher/attendance/[offeringId]/create-session.tsx` (new)
- `src/app/(private)/teacher/attendance/[offeringId]/today-attendance.tsx` (removed)
- `src/app/(private)/teacher/attendance/[offeringId]/edit-session.tsx` (new)
- `src/app/(private)/teacher/attendance/[offeringId]/students.tsx` (new)
- `src/app/(private)/teacher/attendance/[offeringId]/sessions.tsx` (new)
- `src/app/(private)/teacher/attendance/[offeringId]/attendance-summary.tsx` (new)
- `src/app/(private)/teacher/attendance/[offeringId]/student-attendance/[studentId].tsx` (new)
- `src/app/(private)/teacher/attendance/session/[sessionId].tsx`
- `src/features/attendance/attendance.summary.ts` (new)
- `src/features/teacher/services/teacher.service.ts`
- `src/features/teacher/services/teacher.types.ts`
- `src/lib/format/date.ts`
