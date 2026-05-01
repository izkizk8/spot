# Tasks: 072 — Shortcuts Custom UI Snippets

All tasks completed ✅

## T1 — Native bridge types ✅
Create `src/native/shortcuts-snippets.types.ts` with `ShortcutItem`, `SnippetPreviewData`, `ShortcutsInfo`, `ShortcutsSnippetsBridge`, `ShortcutsSnippetsNotSupported`.

## T2 — iOS bridge ✅
Create `src/native/shortcuts-snippets.ts` using `requireOptionalNativeModule` + platform guard.

## T3 — Platform stubs ✅
Create `src/native/shortcuts-snippets.android.ts` and `src/native/shortcuts-snippets.web.ts` — all methods reject with `ShortcutsSnippetsNotSupported`.

## T4 — Hook ✅
Create `src/modules/shortcuts-snippets-lab/hooks/useShortcutsSnippets.ts` with `__setShortcutsSnippetsBridgeForTests` seam.

## T5 — Components ✅
Create: `IOSOnlyBanner`, `ShortcutsInfoCard`, `ShortcutPanel`, `SnippetPreviewCard`, `SetupGuide`.

## T6 — Screens ✅
Create `screen.tsx` (iOS), `screen.android.tsx`, `screen.web.tsx`.

## T7 — Manifest ✅
Create `src/modules/shortcuts-snippets-lab/index.tsx` with id `shortcuts-snippets-lab`, `minIOS: "12.0"`.

## T8 — Plugin ✅
Create `plugins/with-shortcuts-snippets/{package.json,index.ts}` seeding `NSUserActivityTypes`.

## T9 — Registry + app.json ✅
Register module in `registry.ts`; add plugin to `app.json` (42→43).

## T10 — Unit tests ✅
11 test files covering manifest, 3 screens, hook (9 cases), 5 components, plugin (15 cases).

## T11 — Coexistence bumps ✅
6 plugin tests bumped from `toBe(42)` → `toBe(43)` (mapkit, apple-pay, coredata-cloudkit, roomplan, storekit, weatherkit).

## T12 — Format + check ✅
`pnpm format && pnpm check` — all green (729 suites, 4887 tests passed).
