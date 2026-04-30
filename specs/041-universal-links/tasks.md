# Tasks — 041 Universal Links

All tasks completed in single autonomous pass.

| ID    | Task | File(s) | Status |
|-------|------|---------|--------|
| T001  | Module manifest | `src/modules/universal-links-lab/index.tsx` | ✅ |
| T002  | Shared types | `src/modules/universal-links-lab/types.ts` | ✅ |
| T003  | AASA template generator | `src/modules/universal-links-lab/aasa-template.ts` | ✅ |
| T004  | useUniversalLinks hook | `src/modules/universal-links-lab/hooks/useUniversalLinks.ts` | ✅ |
| T005  | ExplainerCard | `components/ExplainerCard.tsx` | ✅ |
| T006  | DomainsList + parseDomain | `components/DomainsList.tsx` | ✅ |
| T007  | TestComposer + validateUrl | `components/TestComposer.tsx` | ✅ |
| T008  | AASAPreviewCard (clipboard) | `components/AASAPreviewCard.tsx` | ✅ |
| T009  | SetupInstructions | `components/SetupInstructions.tsx` | ✅ |
| T010  | InvocationsLog | `components/InvocationsLog.tsx` | ✅ |
| T011  | IOSOnlyBanner | `components/IOSOnlyBanner.tsx` | ✅ |
| T012  | iOS screen | `screen.tsx` | ✅ |
| T013  | Android screen | `screen.android.tsx` | ✅ |
| T014  | Web screen | `screen.web.tsx` | ✅ |
| T015  | Config plugin | `plugins/with-universal-links/{index.ts,package.json}` | ✅ |
| T016  | Register manifest | `src/modules/registry.ts` | ✅ |
| T017  | Wire plugin in app.json + add associatedDomains placeholder | `app.json` | ✅ |
| T018  | Bump with-mapkit plugin count assertion 31→32 | `test/unit/plugins/with-mapkit/index.test.ts` | ✅ |
| T019  | Tests: manifest, registry, aasa-template | (3 files) | ✅ |
| T020  | Tests: hook (13 cases) | useUniversalLinks.test.tsx | ✅ |
| T021  | Tests: 7 components | components/*.test.tsx | ✅ |
| T022  | Tests: 3 screen variants | screen{,.android,.web}.test.tsx | ✅ |
| T023  | Tests: plugin (12 cases) | plugins/with-universal-links/index.test.ts | ✅ |
| T024  | `pnpm format` + `pnpm check` green | — | ✅ |
| T025  | spec.md, plan.md, tasks.md | `specs/041-universal-links/` | ✅ |

## Final results

- **Suites**: 526 (+15 from 040 baseline 511)
- **Tests**: 3669 (+88 from 040 baseline 3581) — 3667 passed, 2 todo, 0 failed
- **pnpm check**: ✅ format ✅ lint ✅ typecheck ✅ test
