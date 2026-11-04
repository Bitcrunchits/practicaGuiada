# Student plan and web storage review follow-ups

## Objective

Keep study-plan enrollment counts consistent with subject cards, handle unavailable browser storage without misrepresenting persisted sessions, and show failed logout to the user.

## Problem and why

- A plan item marked `ACTIVE` shows as enrolled on its card but is counted as not enrolled in the plan summary.
- Accessing `window.localStorage` can throw in a restricted browser context; the web token adapter currently assumes the accessor always succeeds.
- When browser token deletion rejects, the four role-screen logout handlers previously left the session intact but showed no error and returned an unhandled rejection.

These are separate, non-blocking findings from an approved review. The previously reviewed candidate is closed; these changes form a new work unit.

## Authorized scope and constraints

- Adjust the plan summary classification and the web session-token adapter, plus narrowly scoped behavior checks where feasible.
- Explicitly authorized on 2026-11-02: add logout-failure feedback to `src/app/(private)/admin/index.tsx`, `src/app/(private)/student/index.tsx`, `src/app/(private)/student/careers/index.tsx`, and `src/app/(private)/teacher/index.tsx`. Do not broaden this to other screens or auth-provider changes without evidence and authorization.
- Preserve existing native SecureStore behavior, unrelated untracked documentation, API configuration, and other user changes.
- No new dependencies or remote operations; do not commit, push, or open a PR without explicit user authorization.
- Generated technical artifacts use English; new user-facing error copy uses neutral Spanish.
- Expo SDK 57 reference: https://docs.expo.dev/versions/v57.0.0/.

## Tasks

- [ ] SPS-1 Count `ACTIVE` as enrolled in the study-plan summary, consistent with the subject card. Check mixed status inputs, empty values, and TypeScript.
- [ ] SPS-2 Define and implement safe behavior for restricted browser storage. A read should not crash session restoration; a failed save must not silently claim persistence; browser deletion must reject when removal fails or cannot be verified. Verify ordinary and denied storage behavior, including a readable token retained after failed deletion.
- [ ] SPS-3 Handle rejected sign-out on the four authorized role screens. Show a visible, neutral Spanish error while keeping the session and screen intact; navigate to login only on successful sign-out. Do not conflate study-plan load errors with logout errors.

## Route

| Task | Route | Trigger evidence |
| --- | --- | --- |
| SPS-1, SPS-2 | Delegated direct writer | Two distinct behavioral changes in separate non-trivial files; writing preparation stays with the writer. |
| SPS-3 | Delegated direct writer | Four non-trivial role screens; prior read-only mapping completed; one writer handled preparation and implementation. |

## Acceptance and verification

- An `ACTIVE` plan item contributes to the enrolled summary, not the not-enrolled summary; its existing card badge remains enrolled.
- Restricted browser storage has an explicit, predictable read/save/delete behavior compatible with session restoration and login.
- Failed sign-out is caught at every authorized UI call site, produces visible feedback, and does not navigate or clear the active session. Success still navigates to login; the careers screen preserves its study-plan state independently.
- `npx tsc --noEmit` and `git diff --check` pass; run focused runtime checks where the current toolchain allows, record any gaps.
- No unrelated changes; browser and Android behavior remain platform-specific.

## Workload and execution

- Forecast: about 40-100 authored changed lines; planning heuristic only, not a size gate.
- Delivery strategy: ask-on-risk. Commit and PR remain pending because the user requested no commits in the current work.
- TDD mode: not enabled (no configured TDD choice or test script in `package.json`); test runner: none configured. Use ordinary functional checks and a focused harness where feasible.
- Review boundary: the previous candidate was acknowledged as `review-c06346f473f7f5d2`; these follow-ups are a separate candidate.

## Progress and next step

- 2026-11-02: Review approved with two informational reliability warnings (`R3-active-summary`, `R3-web-storage-denied`). Both tasks pending implementation and verification.
- SPS-1 implemented: `getStatusSummary` now counts `ACTIVE` as enrolled; the existing case/whitespace normalization and other buckets are unchanged. `SubjectCard` was not modified for this task.
- SPS-1 focused check: `node --test 'tests/student-plan-summary.test.cjs'` exited 0 (2 tests passed: ACTIVE/case/whitespace and other/empty status buckets). The harness executes the production summary function from the screen; it does not mount the React Native UI.
- SPS-1 DBS check: no new critical issues in the single-condition change and focused test. Rollback boundary: remove the `ACTIVE` condition from `src/app/(private)/student/careers/[careerId]/index.tsx` and `tests/student-plan-summary.test.cjs` without reverting the previously reviewed screen fixes.
- SPS-1 checkbox remains pending: the required work-unit commit is prohibited by the current no-commit instruction.
- SPS-2 initial implementation: the web adapter returns `null` on inaccessible storage reads, originally treated delete as best-effort, and rejects saves on unavailable or failing storage. SSR reads/deletes are safe; SSR saves reject rather than claiming persistence. The login form displays the rejection because `signIn` awaits storage before changing session state. Native SecureStore was not modified.
- SPS-2 initial focused check: `node --test 'tests/secure-storage-web.test.cjs'` exited 0 (4 tests passed: ordinary storage, denied accessor, denied operations, and SSR). The harness executes the production web adapter in mocked browser contexts; it does not exercise a real browser or mount the login flow.
- SPS-2 initial DBS check: no new critical issues in the web adapter and focused test. Initial rollback boundary: restore only `src/lib/storage/secure-storage.web.ts` to its prior local implementation and remove `tests/secure-storage-web.test.cjs`; leave `src/lib/storage/secure-storage.ts` untouched.
- Final checks after the last source edit: `npx tsc --noEmit` exited 0 with no output; `git diff --check` exited 0 with no output (checks tracked diffs; new untracked files were read back separately). These checks apply to both tasks; neither runs a full app or Android session.
- SPS-2 checkbox remains pending: the required work-unit commit is prohibited by the current no-commit instruction.
- Parent spot check: `npx tsc --noEmit` exited 0; `node --test 'tests/student-plan-summary.test.cjs' 'tests/secure-storage-web.test.cjs'` passed all 6 tests; `git diff --check` exited 0.
- Native read-only assessment with the four intended untracked outputs selected: the combined current worktree (which also includes the earlier reviewed edits) had medium risk, 7 paths, 433 changed lines, and `review_due=true` (`slice_budget_reached`). This is not a review receipt for the new bytes.
- SPS-2 accepted follow-up from approved, acknowledged lineage `review-d14203383930eaa5` warning `R3-001`: replace best-effort browser deletion with fail-closed deletion. A restricted `localStorage` accessor, a throwing `removeItem`, a retained token after a silent removal failure, or an unreadable post-delete check now rejects with a clear storage-related error; SSR deletion remains a no-op. `SessionProvider.signOut` awaits deletion before clearing auth state, and logout handlers await sign-out before navigating. The handlers do not catch/display the error, so visible UI feedback remains unverified and outside this work unit. This is separate follow-up work, not a correction to the approved receipt; one bounded writer, no delegation.
- SPS-2 follow-up verification after the final source edit: `node --test 'tests/secure-storage-web.test.cjs'` exited 0 (6/6 passed: ordinary, denied accessor, denied operations, retained token after throwing removal, silent/unverifiable removal, SSR); `node --test 'tests/student-plan-summary.test.cjs'` exited 0 (2/2 passed, SPS-1 regression); `npx tsc --noEmit` exited 0 with no output; `git diff --check` exited 0 with no output (tracked diffs only; new untracked files were read separately). The Node harness uses mocked storage and does not mount a real browser, React Native UI, or Android session.
- SPS-2 follow-up DBS pre-test check: no new critical issues in the adapter or harness; `dbs` CLI unavailable, so the structural/testability check was performed by inspection. Follow-up rollback boundary: revert only the fail-closed delete message and `deleteSessionToken` path in `src/lib/storage/secure-storage.web.ts`, and revert the changed delete assertions and new deletion cases in `tests/secure-storage-web.test.cjs`; retain the existing SPS-2 read/save behavior, SPS-1, native adapter, and approved review receipt.
- Next: SPS-1 and SPS-2 checkboxes remain pending because work-unit commits are prohibited. Any future preflight or review of these new bytes requires separate consent; no commit, PR, or Android-device check has been performed.
- 2026-11-02: The user authorized edits to all four role screens and requested that recovery state be persisted before implementation. The UI mapping found four uncaught `signOut` calls; provider deletion is awaited before state clear. SPS-3 is pending; no source for SPS-3 has been edited yet. Estimated 80-160 authored lines for this task (advisory only).
- SPS-3 implemented locally (delegated direct writer, no child delegation): each authorized screen catches rejected `signOut`, clears stale logout feedback on retry, shows a generic accessible error beside the logout action, disables duplicate in-flight attempts, and navigates to `/login` only after successful sign-out. The careers screen uses a separate logout error without changing study-plan loading/error state. No auth provider, storage adapter, shared UI component, or unrelated screen was changed for SPS-3.
- SPS-3 DBS check and pre-test inspection: no new critical findings (no `any`, production logging, dead code, or business logic in the screens). Repeated small local handlers are an accepted duplication warning under the explicit four-screen scope. The `dbs` CLI was unavailable (`command -v dbs` produced no path), so inspection covered structure and mockable imports before tests were written.
- SPS-3 focused behavior check: `node --test 'tests/logout-feedback.test.cjs'` exited 0 (5/5 passed: failure/retry/single navigation and accessible alert for all four screens; independent careers plan state). The harness transpiles and executes each entire screen module with injected hook, router, and UI stubs; it does not mount React Native or assert real assistive-technology announcements.
- SPS-3 regression check after the last source edit: `node --test 'tests/secure-storage-web.test.cjs' 'tests/student-plan-summary.test.cjs'` exited 0 (8/8 passed). `npx tsc --noEmit` exited 0 with no output. `git diff --check` exited 0 with no output (tracked diffs only; the untracked ODD document and test files were read back separately).
- Runtime/device UI integration: N/A in this work unit; no Android device, emulator, browser, or screen-reader session was run. The Node harness cannot prove rendering/layout, real provider persistence, or TalkBack/VoiceOver announcement behavior; manual testing remains for those boundaries.
- Parent structural readback: all four handlers catch failures and gate navigation; the careers screen renders its logout control/alert only in its plan-success branch, so feedback after a later transition to plan loading/error is not proven. The focused test seeds plan success and does not cover an initial successful sign-out or real device behavior.
- SPS-3 rollback boundary: revert only the logout state/handler/feedback/button changes in `src/app/(private)/admin/index.tsx`, `src/app/(private)/student/index.tsx`, `src/app/(private)/student/careers/index.tsx`, and `src/app/(private)/teacher/index.tsx`; remove `tests/logout-feedback.test.cjs` and this SPS-3 progress/mirror checkpoint. Retain SPS-1/SPS-2 work, the existing web adapter, prior review history, and unrelated user changes.
- SPS-1, SPS-2, and SPS-3 checkboxes remain pending: no authorized work-unit commit or new native review exists. Any future review needs separate consent. No commit, push, PR, or remote execution was performed.
- Mirror checkpoint: the full current document and repo-relative locator `odd/tasks/student-plan-storage-followups.md` are mirrored at Engram topic `odd/student-plan-storage-followups/tasks`; readback is part of the handoff.
