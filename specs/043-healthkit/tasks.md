# Tasks — Feature 043 (HealthKit Lab)

| # | Task | Status |
|---|------|--------|
| T001 | Add `react-native-health` dependency | done |
| T002 | Create `src/modules/healthkit-lab/index.tsx` manifest | done |
| T003 | Create `src/modules/healthkit-lab/sample-types.ts` | done |
| T004 | Create `src/modules/healthkit-lab/hooks/useHealthKit.ts` | done |
| T005 | Create iOS screen (`screen.tsx`) composing the 6 sections | done |
| T006 | Create Android variant (`screen.android.tsx`) | done |
| T007 | Create Web variant (`screen.web.tsx`) | done |
| T008 | Component: AuthorizationCard | done |
| T009 | Component: StepCountCard (BarChart pattern) | done |
| T010 | Component: HeartRateCard (sparkline + manual entry) | done |
| T011 | Component: SleepCard | done |
| T012 | Component: WorkoutCard | done |
| T013 | Component: LiveUpdatesCard | done |
| T014 | Component: IOSOnlyBanner | done |
| T015 | Plugin: `plugins/with-healthkit/{index.ts,package.json}` | done |
| T016 | Wire manifest into `src/modules/registry.ts` | done |
| T017 | Wire plugin into `app.json` plugins array | done |
| T018 | Bump `with-mapkit` plugin-count test 33 → 34 | done |
| T019 | UT: sample-types.test.ts | done |
| T020 | UT: manifest.test.ts | done |
| T021 | UT: registry.test.ts (healthkit-lab) | done |
| T022 | UT: screen iOS / Android / Web (3 suites) | done |
| T023 | UT: 7 component suites | done |
| T024 | UT: hooks/useHealthKit.test.tsx (auth / queries / writes / observer / errors / unmount) | done |
| T025 | UT: with-healthkit plugin (pure + wrapper + coexistence) | done |
| T026 | `pnpm format && pnpm check` green | done |
| T027 | Commit | done |
