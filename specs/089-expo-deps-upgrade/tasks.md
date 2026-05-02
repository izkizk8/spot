---

description: "Tasks for feature 089: Expo SDK 55 dependency alignment"
---

# Tasks: Expo SDK 55 dependency alignment

**Input**: Design documents from `/specs/089-expo-deps-upgrade/`
**Prerequisites**: [spec.md](./spec.md), [plan.md](./plan.md)

This feature is a single-story, sequential change. There is one MVP slice (the dependency bump itself); subsequent tasks are verification gates.

## Phase 1: Setup

- [X] T001 Create feature worktree `spot-089-expo-deps-upgrade` and branch `089-expo-deps-upgrade` from `dev` (post-PR-#2 merge).
- [X] T002 Run `pnpm install --frozen-lockfile` in the worktree to confirm baseline.
- [X] T003 Run `npx expo install --check` to capture the exact list of outdated packages and record it in [spec.md §Assumptions](./spec.md).

---

## Phase 2: User Story 1 — Maintainer launches the dev server without warnings (P1) 🎯 MVP

**Goal**: Update the 5 packages flagged by `expo install --check` to their recommended SDK 55 versions.

**Independent Test**: After applying the bumps, `npx expo install --check` exits 0 with no listed outdated packages, and `pnpm start` no longer prints the warning banner.

- [ ] T004 Run `npx expo install --fix` in `C:\Users\izkizk8\spot-089-expo-deps-upgrade` to update `package.json` and regenerate `pnpm-lock.yaml` for: `@expo/ui`, `expo`, `expo-location`, `expo-notifications`, `react-native-maps`.
- [ ] T005 Re-run `npx expo install --check`; confirm "Dependencies are up to date".
- [ ] T006 Run `pnpm typecheck`; resolve any type errors surfaced by the bumps (none expected).
- [ ] T007 Run `pnpm test`; resolve any test failures surfaced by the bumps (none expected).
- [ ] T008 Run `pnpm lint`; fix any new lint findings (none expected).
- [ ] T009 Run `pnpm docs:check`; ensure the docs gate stays green.
- [ ] T010 Run `pnpm start` briefly (kill once Metro reports "Logs for your project will appear below"); confirm the outdated-deps warning is absent from the boot output.

**Checkpoint**: Story 1 complete — local dev server boots clean.

---

## Phase 3: Polish & Ship

- [ ] T011 Normalise CRLF line endings on all changed text files (`package.json`, `pnpm-lock.yaml`, the new spec/plan/tasks files) using the project's standard PowerShell snippet.
- [ ] T012 Stage and commit with message `chore(089): align Expo SDK 55 deps` and the required `Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>` trailer.
- [ ] T013 Push the branch and open a PR against `dev` summarising the diff (`pnpm install --frozen-lockfile` evidence, `expo install --check` clean output, the 4 quality-gate green ticks). Note that this branch does **not** push a release tag, so no EAS build is triggered.
