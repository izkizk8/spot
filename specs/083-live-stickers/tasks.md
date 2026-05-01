# Tasks — Feature 083: Live Stickers

## Implementation

- [x] Create `specs/083-live-stickers/spec.md`
- [x] Create `specs/083-live-stickers/plan.md`
- [x] Create `specs/083-live-stickers/tasks.md`
- [x] Create `specs/083-live-stickers/quickstart.md`
- [x] Create `src/native/live-stickers.types.ts`
- [x] Create `src/native/live-stickers.ts` (iOS bridge)
- [x] Create `src/native/live-stickers.android.ts` (Android stub)
- [x] Create `src/native/live-stickers.web.ts` (Web stub)
- [x] Create `src/modules/live-stickers-lab/hooks/useLiveStickers.ts`
- [x] Create `src/modules/live-stickers-lab/components/IOSOnlyBanner.tsx`
- [x] Create `src/modules/live-stickers-lab/screen.tsx` (iOS)
- [x] Create `src/modules/live-stickers-lab/screen.android.tsx`
- [x] Create `src/modules/live-stickers-lab/screen.web.tsx`
- [x] Create `src/modules/live-stickers-lab/index.tsx`
- [x] Create `plugins/with-live-stickers/index.ts`
- [x] Create `plugins/with-live-stickers/package.json`
- [x] Update `src/modules/registry.ts` (add import + entry)
- [x] Update `app.json` (add `./plugins/with-live-stickers`)

## Tests

- [x] Create `test/unit/modules/083-live-stickers/manifest.test.ts`
- [x] Create `test/unit/modules/083-live-stickers/useLiveStickers.test.tsx`
- [x] Create `test/unit/modules/083-live-stickers/screen.test.tsx`
- [x] Create `test/unit/modules/083-live-stickers/screen.android.test.tsx`
- [x] Create `test/unit/modules/083-live-stickers/screen.web.test.tsx`
- [x] Create `test/unit/plugins/with-live-stickers/index.test.ts`
- [x] Bump plugin count in `test/unit/plugins/with-mapkit/index.test.ts`
- [x] Bump plugin count in `test/unit/plugins/with-apple-pay/index.test.ts`
- [x] Bump plugin count in `test/unit/plugins/with-coredata-cloudkit/index.test.ts`
- [x] Bump plugin count in `test/unit/plugins/with-roomplan/index.test.ts`
- [x] Bump plugin count in `test/unit/plugins/with-storekit/index.test.ts`
- [x] Bump plugin count in `test/unit/plugins/with-weatherkit/index.test.ts`

## Quality gate

- [x] `pnpm format && pnpm check` green
- [x] Commit with Co-authored-by trailer
