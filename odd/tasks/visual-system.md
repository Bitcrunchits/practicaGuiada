# Visual system — navy/ink, square containers

## Objective

Replace the current rounded, bright-blue visual system with a squared, institutional
navy/ink system that keeps the ITS green as an accent and makes the existing screens
feel more professional, without changing the feature-based architecture.

## Problem

The app currently uses `#2563EB` primary, light-gray borders, and rounded corners on
almost every surface. The result is generic and inconsistent: some headers use dark text
on blue, `teacher/profile.tsx` references a missing `theme.colors.accent`, and several
hardcoded radii bypass the theme. The TypeScript baseline is also broken (`tsconfig.json`
paths without `./`, plus two real errors in `teacher/profile.tsx`).

## Why

The user wants to keep the architecture and move faster toward the teacher/student
attendance flow. A centralized, square, navy/ink design system gives every existing
screen a consistent base before the flow work starts. The palette must respect the ITS
identity: green, white, black, and blue.

## Scope

In scope for this slice:

- Fix the TypeScript baseline.
- Rewrite `src/constants/theme.ts` with the approved palette and `radius: 0`.
- Update the core UI primitives: `AppButton`, `AppInput`, `FeedbackState`, `Skeleton`,
  `Screen`, `offlineBanner`.
- Add `AppCard`, `AppScreenHeader`, `StatusBadge`.
- Apply the new system to `login`, teacher home, and student home.
- Update `AGENTS.md` to point at Expo SDK 57 docs.

Out of scope:

- Teacher attendance flow (students, class sessions, marking, saving).
- Student enrollments/history flow.
- Changes to `.atl/` or `.vscode/`.
- New dependencies, icon libraries, or navigation changes.
- Deleting unused files (`AuthImput.tsx`, `algo.tsx`); only note them as cleanup.

## Constraints

- Preserve the existing folder structure and feature boundaries.
- Keep existing theme keys so untouched screens continue to compile.
- No emojis in UI copy.
- Spanish UI copy, neutral/professional register.
- No shadows; hierarchy comes from headers, 1px borders, spacing, and section labels.
- UI must remain accessible: `Pressable` cards use `accessibilityRole="button"` and
  disabled buttons expose `accessibilityState`.
- No commits unless the user asks.

## Tasks

- [x] VS-1 Fix TypeScript baseline: `tsconfig.json` paths to `./src/*`; fix
      `teacher/profile.tsx` import path and the missing `accent` token.
- [x] VS-2 Rewrite `src/constants/theme.ts`: navy/ink palette, institutional blue,
      green accent, semantic colors, `radius` all zero, keep `spacing`/`fontSize`.
- [x] VS-3 Update `AppButton`, `AppInput`, `FeedbackState`, `Skeleton`, `Screen`,
      `offlineBanner` to square containers and the new tokens.
- [x] VS-4 Add `AppCard`, `AppScreenHeader`, `StatusBadge` in `src/components/ui/`.
- [x] VS-5 Apply the system to `(public)/login.tsx`, `LoginForm`, `teacher/index.tsx`,
      and `student/index.tsx`.
- [x] VS-6 Run `npx tsc --noEmit` and report the actual result.

## Route

| Task | Route | Trigger evidence |
| --- | --- | --- |
| VS-1 | Delegated writer | Two non-trivial files plus a design-system change; writer trigger. |
| VS-2 | Delegated writer | Shared theme used by many screens; writer trigger. |
| VS-3 | Delegated writer | Five UI primitives; writer trigger. |
| VS-4 | Delegated writer | Three new UI components; writer trigger. |
| VS-5 | Delegated writer | Three screens plus one form; writer trigger. |
| VS-6 | Parent | Single read-only verification command. |

One bounded writer for the whole slice; the parent verified the result.

## Acceptance criteria

- `npx tsc --noEmit` exits 0.
- All corners in the touched surfaces are square (radius 0); no shadows.
- Login, teacher home, and student home use the navy header, white containers, black
  1px borders, and institutional blue actions.
- Green appears only as an accent (logo/header rule/role label/success), not as a large
  surface.
- Existing untouched screens still render with the new tokens (they inherit the theme).
- No new dependency is added.

## Checks

- `npx tsc --noEmit` — passed, exit 0.
- Manual visual check on device/emulator by the user after the slice — passed; the user approved the visual direction ("me gusta").

## Progress

- 2026-10-29: Slice approved by the user. Task file created.
- 2026-10-29: Writer implemented VS-1..VS-5 and reported `npx tsc --noEmit` exit 0.
- 2026-10-29: Parent re-ran `npx tsc --noEmit`; observed exit 0, no diagnostics.
- 2026-10-29: Parent structural readback of theme, primitives, new components, login,
  and both homes; no blocking defect found.
- 2026-10-29: Native RDD review preflight returned
  `immutable_review_transport_unsupported` (the active runtime cannot provide immutable
  receipt-review transport). No PASS was invented; delivery follows ordinary repository
  policy. This is a runtime limitation, not a code result.
- 2026-10-29: User reviewed the slice in Expo Go and approved the visual direction
  ("me gusta"). The visual base is accepted.

## Files changed

- `tsconfig.json`
- `AGENTS.md`
- `src/constants/theme.ts`
- `src/components/ui/AppButton.tsx`
- `src/components/ui/AppInput.tsx`
- `src/components/ui/FeedbackState.tsx`
- `src/components/ui/Skeleton.tsx`
- `src/components/ui/Screen.tsx`
- `src/components/ui/offlineBanner.tsx`
- `src/components/ui/AppCard.tsx` (new)
- `src/components/ui/AppScreenHeader.tsx` (new)
- `src/components/ui/StatusBadge.tsx` (new)
- `src/app/(public)/login.tsx`
- `src/features/auth/components/LoginForm.tsx`
- `src/app/(private)/teacher/index.tsx`
- `src/app/(private)/student/index.tsx`
- `src/app/(private)/teacher/profile.tsx` (import fix only)

## Next step

Second visual slice: apply `AppScreenHeader`, `AppCard`, and `StatusBadge` to the
remaining screens (teacher attendance, teacher profile, student careers/year/subject/
attendance) and add role guards. Then implement the teacher attendance flow: students,
class sessions, attendance marking, bulk save, and history.
