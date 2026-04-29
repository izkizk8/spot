# Phase 0 Research — Share Sheet Module (033)

**Companion to**: [plan.md](./plan.md) §"Resolved decisions"

This document records the code-level detail behind plan-level
decisions **R-A** through **R-G**, plus §8 ("Excluded activity catalog
scope"). Spec-level decisions were already approved in `spec.md`;
they are not re-litigated here.

All sections below follow the **Decision / Rationale / Alternatives
considered** template.

---

## §1 — R-A: Bridge-level serialisation of concurrent `present()` calls

### Decision

`src/native/share-sheet.ts` exposes an internal, module-scoped promise
chain inherited verbatim from features 030 / 031 / 032:

```ts
let chain: Promise<unknown> = Promise.resolve();

function enqueue<T>(work: () => Promise<T>): Promise<T> {
  const next = chain.then(work, work); // run regardless of prior outcome
  chain = next.catch(() => undefined); // don't poison the chain
  return next;                          // preserve original rejection for the caller
}
```

The async bridge method `present(opts)` wraps its native call through
`enqueue(...)`. The synchronous read-only `isAvailable()` is NOT
serialised. The Android and Web variants apply the same chain so that
two rapid Share taps on Android (file path) or Web (`navigator.share`
path) also serialise.

### Rationale

- Two rapid taps on **Share** would otherwise call
  `UIActivityViewController.present` twice in parallel; UIKit handles
  the second by ignoring it but the rejection is not deterministic.
  Serialising at the JS bridge ensures the second `present()` only
  fires AFTER the first sheet has resolved its
  `completionWithItemsHandler`, giving tests the deterministic
  invariant: "two back-to-back `present()` calls produce exactly two
  native invocations in submission order".
- Inheriting the helper verbatim from 030 / 031 / 032 reduces reviewer
  cognitive load and reuses the same flake-free guarantee that prior
  bridge tests demonstrated.
- Errors are preserved for the caller but the chain itself is
  detoxified by `chain.catch(...)` so a rejected presentation does
  not block subsequent ones.

### Alternatives considered

- **No serialisation** — rejected; UIKit's "ignore second present"
  behaviour is documented but not deterministic across iOS versions.
- **Serialise at the Swift layer with a single semaphore** — rejected;
  harder to assert in JS tests; adds Swift-side state to clean up.
- **Reject the second call synchronously when busy** — rejected;
  contradicts the UX expectation that a tapped Share button always
  eventually presents.

---

## §2 — R-B: Synchronous URL validation

### Decision

`UrlContentInput` validates its current value via:

```ts
function isValidShareUrl(raw: string): boolean {
  if (!raw) return false;
  if (!/^https?:\/\//i.test(raw)) return false;
  try {
    // The URL constructor throws on malformed input. We don't read
    // any property of the parsed URL — just rely on the throw.
    // eslint-disable-next-line no-new -- NOTE: This eslint-disable
    // comment is illustrative; in implementation we use
    // `void new URL(raw);` to avoid the disable directive entirely.
    void new URL(raw);
    return true;
  } catch {
    return false;
  }
}
```

The validation is invoked on every keystroke (memoised against the
raw string). When `false`, the parent screen disables the **Share**
button and renders an inline error message ("Enter a URL starting
with http:// or https://").

### Rationale

- Pure, no I/O, no network round-trip.
- The `^https?:` prefix guard rejects `URL`-acceptable but
  scheme-irrelevant inputs like `mailto:foo@bar.baz` and
  `javascript:alert(1)` — both would parse via `new URL(...)` but
  neither is a useful share target.
- Synchronous: matches the spec's FR-005 expectation of immediate
  inline feedback.

### Alternatives considered

- **Regex-only validation** — rejected; URL grammar is too rich for a
  one-line regex without false positives (e.g., `https:///foo`).
- **Async validation via `fetch(HEAD)`** — rejected; no network
  dependency at validation time, and offline scenarios should not
  block share.
- **Library (e.g., `validator.js`)** — rejected; adds a runtime dep
  for a 6-line function.

---

## §3 — R-C: No plugin needed

### Decision

**No `Info.plist` keys are required for `UIActivityViewController` or
for in-app `UIActivity` subclasses.** The feature ships **without** a
config plugin. `app.json` is **not** modified. `plugins/with-share-sheet/`
is **not** created.

### Rationale

- `UIActivityViewController` is a system-provided UIKit controller
  available since iOS 6.0 with no `Info.plist` registration. It does
  not require:
  - `LSApplicationQueriesSchemes` (no `canOpenURL` calls)
  - `NSExtensionPointIdentifier` (this is a Share Extension target
    declaration, **not** an in-app activity controller)
  - `NSPhotoLibraryUsageDescription` / `NSCameraUsageDescription`
    (the share sheet itself doesn't read the photo library; specific
    activities like SaveToCameraRoll *do*, but those usage strings
    are owned by the activities and are already required by features
    that exercise them — feature 015 / 016 / 032 in this repo)
  - `LSSupportsOpeningDocumentsInPlace` / `UIFileSharingEnabled` (the
    share sheet writes through `expo-sharing` which already has its
    own plist surface, owned by feature 032)
- In-app `UIActivity` subclasses (`CopyWithPrefixActivity`) are
  in-process objects whose lifecycle is owned by the presenting
  controller. They do **not** need to be declared in any
  `NSExtensionPointIdentifier` (which is the Share Extension surface
  — separate target binary, separate `Info.plist`, separate App
  Group, all out of scope per spec §"Out of Scope").
- The custom activity writes to `UIPasteboard.general` (a system
  shared pasteboard). iOS 14+ surfaces a transient banner when a
  pasteboard write occurs but does NOT require an `Info.plist`
  entitlement to perform the write. (Reading another app's pasteboard
  *would* require a privacy prompt — the custom activity only
  *writes*.)

### Alternatives considered

- **Author a no-op plugin anyway** — rejected; FR-021 explicitly
  permits skipping the plugin when research confirms no key is
  needed, and adding a no-op plugin entry to `app.json` would still
  count as a non-additive edit to that file (additive at the array
  level, but a future plugin-conflict regression vector).
- **Add `NSPasteboardUsageDescription`** — rejected; macOS Catalyst
  surface only, not iOS, and 033 doesn't ship a Catalyst variant.
- **Author an empty placeholder plugin so future plist mutations have
  a home** — rejected per YAGNI; if a future revision needs
  `Info.plist` keys, adding the plugin then is one additive commit,
  not a precondition for 033.

---

## §4 — R-D: Cross-platform error classification + clipboard fallback

### Decision

The JS bridge classifies errors at the variant boundary rather than
forwarding raw native errors to the hook:

| Platform | Path | Bridge behaviour |
|----------|------|------------------|
| iOS | any content | Native `present()` resolved Promise -> `{ activityType, completed }` mapped 1:1 to `ShareResult`. Reject -> `Error` propagated to hook. |
| Android | file content | `expo-sharing.shareAsync(uri)` -> resolves with `{ activityType: null, completed: true }` (Android Share API does not surface chosen target). |
| Android | text / URL content | `expo-clipboard.setStringAsync(text)` -> resolves with `{ activityType: 'android.clipboard-fallback', completed: true }`. |
| Android | image content | `expo-sharing.shareAsync(uri)` if the image has a resolvable file URI; otherwise clipboard-fallback (image alt text). |
| Web | text / URL | If `'share' in navigator` -> `await navigator.share(...)` -> `{ activityType: null, completed: true }`. If `AbortError` -> `{ activityType: null, completed: false }`. Else -> `expo-clipboard.setStringAsync(text)` -> `{ activityType: 'web.clipboard-fallback', completed: true }`. |
| Web | image / file | `navigator.share` with `files` if supported (browser-dependent); else clipboard fallback (filename or alt text). |

**`ShareSheetNotSupported`** is reserved for **caller-side
capability requests** that are iOS-only — explicitly: requesting a
non-empty `excludedActivityTypes`, `includeCustomActivity: true`, or
a non-null `anchor` on a non-iOS platform. The screen prevents this
by disabling the corresponding controls. The hook treats the typed
error as a programming bug and surfaces it as outcome `'error'` with
the typed name in the log entry's `errorMessage` field.

### Rationale

- FR-019 mandates: "MUST NOT throw for the basic share path". The
  classification above ensures Android and Web always resolve for
  text / URL / file shares, even when the platform-native API
  rejects.
- Distinct activityType strings (`'web.clipboard-fallback'` vs
  `'android.clipboard-fallback'`) keep the result log analytics clean
  and let on-device verification distinguish "fell back on Web
  because no Share API" from "fell back on Android because content
  type was text".
- Catching at the variant boundary (rather than at the hook level)
  keeps the hook platform-agnostic and the bridge tests simple to
  enumerate per platform.

### Alternatives considered

- **Throw `ShareSheetNotSupported` always on non-iOS, let the hook
  fall back** — rejected; pushes platform branching into the hook,
  violating the bridge's encapsulation principle.
- **Single synthetic activityType string** — rejected; loses the
  ability to distinguish Web fallback from Android fallback in the
  log, which is a documented success criterion (SC-007 + acceptance
  scenarios US6-AS1 / US6-AS2).
- **Use `Share.share` from `react-native` for Android** — rejected;
  has known issues with file URIs on Android 11+ and is being phased
  out in favour of `expo-sharing`, which is already a project dep.

---

## §5 — R-E: documents-lab read interface + bundled fallback

### Decision

`FileContentPicker` reads from feature 032's documents-store via a
narrow, stable read API. The bridge is conceptual rather than
literal — feature 032's store exposes its state via the
`useDocuments()` hook (or equivalent). 033's component imports that
hook and reads only `.files` (a `readonly DocumentEntry[]`). If the
import fails (032's hook is renamed) or the array is empty, the
panel falls back to a single bundled file row sourced from
`src/modules/share-sheet-lab/samples/sample.txt` (a tiny UTF-8 text
file shipped in this feature's directory; if 032's
`samples/hello.txt` is reusable, the bundle import points there
instead — confirmed at implementation time).

### Rationale

- Spec §Assumptions explicitly permits the degraded fallback when
  documents-lab is unavailable; this keeps 033 strictly additive and
  not coupled to 032's internals.
- A bundled fallback file is required so the FileContentPicker is
  never empty on first launch (before the user has imported anything
  via documents-lab); FR-007 makes this explicit.
- A pure-JS read (no AsyncStorage roundtrip from this feature)
  reduces test complexity — `FileContentPicker.test.tsx` mocks the
  hook import directly.

### Alternatives considered

- **Re-implement an AsyncStorage read of `spot.documents.list`** —
  rejected; duplicates 032's tolerant-rehydration logic and risks
  divergence on schema changes.
- **Bundle a duplicate of 032's sample files** — rejected; the spec
  already says the picker degrades gracefully to a single fallback
  row; bundling more samples would be visual noise.
- **Make the FileContentPicker iOS-only** — rejected; FR-007 makes no
  platform exclusion, and reading from documents-lab works on all
  three platforms.

---

## §6 — R-F: iPad anchor capture via `onLayout` + ref-scoped rect map

### Decision

`AnchorSelector` is a 2x2 grid of four `Pressable` buttons. Each
button accepts an `onLayout={(e) => rectsRef.current[key] =
e.nativeEvent.layout}` handler. `rectsRef` is a `useRef<Record<
'top-left'|'top-right'|'center'|'bottom', AnchorRect>>` initialised
to a zero rect per key. The selected key is held in React state for
visual highlighting, but the rect read at `share()` time comes from
`rectsRef.current[selectedKey]` — never from the rect captured at
selection time.

### Rationale

- iPad orientation changes between selection and share are common.
  Reading the rect at share time uses the latest measured frame,
  which correctly reflects the new screen geometry.
- A ref-scoped map (rather than React state) avoids re-rendering on
  every `onLayout` event and keeps the selector visually stable.
- Defaulting to `'top-left'` on iPad mount means a Share tap before
  any explicit anchor selection still has a non-null rect — preventing
  the iPad-only crash R1 in the plan's risk table.

### Alternatives considered

- **`measureInWindow` at share time** — rejected; async, adds a
  promise hop, and the `onLayout` value is sufficient (it's already
  in the parent's coordinate space, which `popoverPresentationController`
  accepts when paired with the matching `sourceView`).
- **Capture the rect on selection only** — rejected; orientation
  changes between select and share would crash with a stale rect.
- **Always anchor to the screen center** — rejected; defeats the
  purpose of the demo (showcasing the four anchor presets).

---

## §7 — R-G: Swift presenter lifecycle + completion handler shape

### Decision

`ShareSheetPresenter.swift` is an Expo Module class:

```swift
public class ShareSheetModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ShareSheet")
    AsyncFunction("present") { (opts: SharePayload, promise: Promise) in
      DispatchQueue.main.async {
        // Build activity items
        // Append CopyWithPrefixActivity if opts.includeCustomActivity
        // Compose UIActivityViewController
        // Set excludedActivityTypes from opts.excludedActivityTypes
        // Set popoverPresentationController.{sourceView, sourceRect}
        //   from opts.anchor (iPad only)
        // Resolve from completionWithItemsHandler:
        //   { activityType: activityType?.rawValue ?? NSNull(),
        //     completed: completed }
        // Strong-ref self via associated object until dismissal
      }
    }
    Function("isAvailable") { () -> Bool in true }
  }
}
```

The presenter lifecycle:

1. JS calls `present(opts)`.
2. Swift dispatches to main queue, builds the controller.
3. Controller is presented over the current root view controller
   (using the `UIApplication.shared.keyWindow?.rootViewController`
   first-presented-controller traversal pattern from feature 032's
   QuickLookPresenter).
4. `completionWithItemsHandler` fires once the user picks an activity
   or dismisses; resolves the JS Promise.
5. Strong reference is released via the associated object on the
   controller (auto-released when the controller deallocates).

### Rationale

- Mirrors 032's `QuickLookPresenter` lifecycle exactly — same
  reviewer mental model.
- The `completionWithItemsHandler` is the canonical UIKit callback
  for `UIActivityViewController` dismissal; using it (rather than a
  delegate or a notification) avoids holding a delegate reference
  beyond the sheet's lifetime.
- Resolving with `activityType?.rawValue ?? null` keeps the JS-side
  contract a clean discriminated union: a non-null string means a
  destination was chosen; null means cancelled.

### Alternatives considered

- **Store the presenter in a static singleton** — rejected; prevents
  multiple concurrent invocations even if R-A's serialisation is
  bypassed; harder to test.
- **Resolve when the sheet *appears* (not when it dismisses)** —
  rejected; loses the `activityType` and `completed` payload, which
  are the spec's primary outputs (FR-013).
- **Use a `UIViewController` extension as the host** — rejected;
  Expo Module classes are the project's standard bridge surface
  (013 / 014 / 027 / 028 / 029 / 030 / 031 / 032 all use it).

---

## §8 — Excluded activity catalog scope

### Decision

The `activity-types.ts` catalog includes the following 12 well-known
post-iOS-8 `UIActivity.ActivityType` values:

| ID | Label |
|----|-------|
| `com.apple.UIKit.activity.Mail` | Mail |
| `com.apple.UIKit.activity.Print` | Print |
| `com.apple.UIKit.activity.AirDrop` | AirDrop |
| `com.apple.UIKit.activity.Message` | Message |
| `com.apple.UIKit.activity.AddToReadingList` | Add to Reading List |
| `com.apple.UIKit.activity.AssignToContact` | Assign to Contact |
| `com.apple.UIKit.activity.CopyToPasteboard` | Copy |
| `com.apple.UIKit.activity.PostToFacebook` | Post to Facebook |
| `com.apple.UIKit.activity.PostToTwitter` | Post to Twitter |
| `com.apple.UIKit.activity.SaveToCameraRoll` | Save Image |
| `com.apple.UIKit.activity.OpenInIBooks` | Open in Books |
| `com.apple.UIKit.activity.MarkupAsPDF` | Markup |

Plus two synthetic platform-fallback activity-type strings:

- `'web.clipboard-fallback'` — emitted by the Web bridge when
  `navigator.share` is unavailable and the payload was copied to the
  clipboard.
- `'android.clipboard-fallback'` — emitted by the Android bridge for
  text/URL payloads that fall through to the clipboard.

### Rationale

- Twelve entries are sufficient for the demo (the screen renders a
  scrollable checklist; more would be visual noise).
- All twelve are stable from iOS 8 onward, which matches the module's
  declared `minIOS: '8.0'`.
- The synthetic constants live alongside the iOS catalog so the
  result log can render every observed `activityType` from a single
  lookup.

### Alternatives considered

- **Include every `UIActivity.ActivityType` constant Apple has ever
  shipped** — rejected; some (Vimeo, Flickr, Tencent Weibo, Sina
  Weibo) were deprecated before iOS 14 and would either be invisible
  on modern iOS or fire deprecation warnings.
- **Generate the catalog at build time from a Swift introspection
  pass** — rejected; complicates the build pipeline for no gain
  (catalog is hand-stable across iOS versions).
- **Make the catalog user-extensible at runtime via a settings
  screen** — rejected; out of scope for v1, can be added in a
  follow-up if a use case emerges.
