# Quickstart — PassKit / Wallet (Add Pass) Module (036)

**Companion to**: [plan.md](./plan.md), [spec.md](./spec.md)

This quickstart covers verification at three levels:

1. **JS-pure** (Windows / CI / any developer machine): no Apple
   Developer account, no device, no signed pass required.
2. **`expo prebuild` smoke-test** (any machine with Node + pnpm):
   confirms the config plugin produced the expected entitlements
   and framework linkage.
3. **On-device** (iOS 13.4+ device + a Pass Type ID + a signed
   `.pkpass` URL): the only level that actually adds a pass to
   Apple Wallet.

## ⚠️ Pass signing barrier (read first)

Apple Wallet only accepts `.pkpass` packages **signed** with a
developer-issued certificate tied to a registered **Pass Type ID**
(`pass.<reverse-dns>`). The signing artifacts cannot be checked
into a public repository. This module ships as a **code-complete
educational scaffold**; the on-device flow at level 3 is reachable
only when the user supplies their own Pass Type ID and a signed
`.pkpass`. Users without those artifacts can still exercise levels 1
and 2 in full and tap through the entire UI on a real iOS device —
they just see "Pass signing required" / "Download failed" /
"Pass invalid or unsigned" status text instead of a real pass added
to Wallet.

This barrier is repeated in three additional locations: the
on-screen `EntitlementBanner` and `AddSamplePassCard`, the spec's
"Pass Signing Reality Check" section, and the spec's "Assumptions"
section.

## 1. JS-pure verification

Run from the repo root, on Windows or any platform with Node + pnpm:

```powershell
pnpm install
pnpm check     # format + lint + typecheck + tests
```

Expectations (after T001–T011 land):

- `pnpm format` is a no-op (no diff).
- `pnpm lint` reports zero warnings; in particular, **zero
  `eslint-disable` directives** anywhere in the new module
  (FR-029).
- `pnpm typecheck` is green (TypeScript strict).
- `pnpm test` runs **at least 14 new test suites** introduced by
  036:
    - `test/unit/modules/passkit-lab/manifest.test.ts`
    - `test/unit/modules/passkit-lab/pass-types.test.ts`
    - `test/unit/modules/passkit-lab/screen.test.tsx`
    - `test/unit/modules/passkit-lab/screen.android.test.tsx`
    - `test/unit/modules/passkit-lab/screen.web.test.tsx`
    - `test/unit/modules/passkit-lab/hooks/usePassKit.test.tsx`
    - `test/unit/modules/passkit-lab/components/{Capabilities,
      AddSamplePass, MyPassesList, PassRow, AddFromUrl,
      SetupGuide, EntitlementBanner, IOSOnlyBanner}Card.test.tsx`
      (8 component suites)
    - `test/unit/native/passkit.test.ts`
    - `test/unit/plugins/with-passkit/index.test.ts`

Sanity checks reviewers can run by hand:

```powershell
# 1. Module count: registry should have 31 entries (30 prior + 1).
Select-String -Path src\modules\registry.ts -Pattern '^\s*\w+,\s*$' | Measure-Object

# 2. Plugin count: app.json's expo.plugins array should have 23 entries.
node -e "console.log(require('./app.json').expo.plugins.length)"  # → 23

# 3. No eslint-disable in the feature.
Select-String -Path src\modules\passkit-lab\**\*.ts*,src\native\passkit*,plugins\with-passkit\**\*.ts -Pattern 'eslint-disable'  # → empty

# 4. Bridge module-name uniqueness.
Select-String -Path src\native\*.ts -Pattern "requireNativeModule\('PassKitBridge'\)"  # → exactly 1 match (passkit.ts)
```

## 2. `expo prebuild` smoke test

This step requires Node + pnpm only (no Xcode, no iOS device). It
verifies the `with-passkit` plugin produces the expected iOS project
deltas.

```powershell
pnpm install
pnpm exec expo prebuild --platform ios --no-install --clean
```

Then assert (manually or via a small Node script):

1. **Entitlement key present**:
   `ios/<AppName>/<AppName>.entitlements` contains a non-empty
   `<key>com.apple.developer.pass-type-identifiers</key>` array, with
   a single string entry equal to
   `$(TeamIdentifierPrefix)pass.example.placeholder` (the documented
   placeholder).

   ```powershell
   Select-String -Path ios\*\*.entitlements -Pattern 'pass-type-identifiers' -Context 0,3
   ```

2. **PassKit.framework linked**: the main target's "Frameworks"
   build phase in `ios/<AppName>.xcodeproj/project.pbxproj`
   references `PassKit.framework` exactly once.

   ```powershell
   (Select-String -Path ios\*.xcodeproj\project.pbxproj -Pattern 'PassKit\.framework' | Measure-Object).Count  # → ≥ 1, expected exactly 1 per build phase
   ```

3. **Idempotency**: re-running `expo prebuild` with the same
   `app.json` MUST produce a deep-equal iOS project. A simple proof:

   ```powershell
   pnpm exec expo prebuild --platform ios --no-install --clean
   git diff --stat ios/   # → no changes
   pnpm exec expo prebuild --platform ios --no-install
   git diff --stat ios/   # → still no changes
   ```

4. **No regression to prior plugins' output**: the entitlements file
   continues to carry the keys added by the 22 prior plugins (e.g.,
   `com.apple.security.application-groups` from 014 / 015 / 027 /
   028, `com.apple.developer.applesignin` from 011, etc.). The
   plugin composition test (`test/unit/plugins/with-passkit/`)
   asserts byte-equality of those keys after composition (SC-007).

## 3. On-device verification (iOS 13.4+ + Pass Type ID + signed pass)

**Prerequisites** (Apple-side, NOT shipped):

- An Apple Developer account with a registered **Pass Type ID** (e.g.,
  `pass.com.yourcompany.demo`) at developer.apple.com →
  Certificates, Identifiers & Profiles → Identifiers.
- A Pass Type ID **signing certificate** (`.p12`) generated from
  that identifier.
- A built and **signed** `.pkpass` package, hosted at a reachable
  URL (or available locally and dropped in at the documented bundle
  path). Producing this typically uses Apple's `signpass` tool or an
  equivalent toolchain (`pass.json` + assets + `manifest.json` +
  `signature`).
- A physical iOS 13.4+ device (the simulator does not persist passes
  to Wallet).

### Step 3.1 — Substitute the placeholder entitlement

Edit `app.json` to replace the placeholder Pass Type ID with the real
one. The shape is the array form Apple expects in
`com.apple.developer.pass-type-identifiers`:

```json
{
  "expo": {
    "ios": {
      "entitlements": {
        "com.apple.developer.pass-type-identifiers": [
          "$(TeamIdentifierPrefix)pass.com.yourcompany.demo"
        ]
      }
    }
  }
}
```

The `with-passkit` plugin detects the operator-supplied value and
preserves it (R-G); the placeholder is only inserted when the array
is missing or empty.

### Step 3.2 — Rebuild and install

```powershell
pnpm install
pnpm exec expo prebuild --platform ios --clean
# Then either:
#   (a) open ios/<AppName>.xcworkspace in Xcode and run on device, or
#   (b) submit an EAS Build:
pnpm exec eas build --platform ios --profile development
```

### Step 3.3 — Exercise the flow

On the device, open the app → Modules → "Wallet (PassKit)".
Verify:

1. **Entitlement banner is HIDDEN** (the operator-supplied value is
   no longer the placeholder).
2. **Capabilities card** shows both pills as
   "Pass library: available" / "Can add passes: yes".
3. **Add From URL** — paste the URL of the signed `.pkpass`, tap
   **Fetch and add**. `PKAddPassesViewController` slides up.
   Approve. Status updates to "Pass added".
4. **My Passes** — tap **Refresh**. The new pass appears with its
   `serialNumber`, `organizationName`, `localizedDescription`, and
   `passType` label.
5. **Open in Wallet** — tap on the new pass's row. On iOS 13.4+,
   Wallet opens directly to that pass.
6. **Re-adding the same pass** — paste the same URL again. Wallet
   replaces the existing pass; My Passes refresh shows it once.

### Step 3.4 — Cancellation and error paths

- **User cancellation**: tap Fetch and add, then tap **Cancel** on
  the system sheet. Status should read "Cancelled". No state
  changes; `lastResult.kind === 'cancelled'`.
- **Bad URL** (404 or non-pass content): paste a URL that returns a
  404 or a non-pkpass MIME type. Status should read
  "Download failed (status 404)" or "Pass invalid or unsigned"
  respectively.
- **iOS 13.0–13.3** (separate device or simulator): the Open in
  Wallet button on each `PassRow` should be disabled with an
  accessibility hint of "Requires iOS 13.4 or later".

### Step 3.5 — Cross-platform sanity

- **Android** (any device or emulator): open the module. Verify
  `IOSOnlyBanner` is visible at the top, all action buttons are
  disabled, and zero JavaScript exceptions are thrown over a
  60-second exploration (SC-005).
- **Web** (Chrome / Safari): same behaviour as Android. Additionally
  verify (via the bundler's report) that
  `src/native/passkit.ts` is NOT in the web bundle's import
  closure — only `src/native/passkit.web.ts` is.

## 4. Manual smoke checklist (pre-merge)

- [ ] Level 1 (`pnpm check`) — green; ≥ 14 new test suites
- [ ] Level 2 (`expo prebuild` smoke) — entitlement + framework
      assertions pass; idempotency verified
- [ ] Level 3 (on-device) — at minimum one maintainer with a Pass
      Type ID confirms steps 3.3 + 3.4 + 3.5; for everyone else,
      level 3 is documented but not gating
- [ ] `git diff --stat` against parent branch shows changes ONLY in:
      - `specs/036-passkit-wallet/`
      - `src/modules/passkit-lab/**`
      - `src/native/passkit.{ts,android.ts,web.ts,types.ts}`
      - `native/ios/passkit/**`
      - `plugins/with-passkit/**`
      - `test/unit/modules/passkit-lab/**`
      - `test/unit/native/passkit.test.ts`
      - `test/unit/plugins/with-passkit/**`
      - `src/modules/registry.ts` (≤ 2 lines)
      - `app.json` (≤ 1 plugin entry)
      - `.github/copilot-instructions.md` (SPECKIT marker block only)
- [ ] No `eslint-disable` directives anywhere in 036 sources
- [ ] Constitution v1.1.0 gates pass

## 5. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `expo prebuild` fails with "Cannot read property 'pass-type-identifiers' of undefined" | `app.json` `ios.entitlements` not initialised | Ensure `expo.ios.entitlements` exists (the plugin creates it if absent in modern config-plugins; otherwise a one-time edit of `app.json`). |
| `PKAddPassesViewController` does not present | A modal alert / view controller is up; the bridge couldn't find a non-presented top controller | Reproduce with no other modals visible. The bridge walks `presentedViewController` chains (research §R4); file a bug if a real-world scenario breaks the walk. |
| "Pass invalid or unsigned" on a pass you signed | The pass was re-archived after signing (manifest mismatch), or signed with a cert that doesn't match the `passTypeIdentifier` in `pass.json` | Re-sign with the matching cert; re-archive ONLY the signed manifest. |
| Open in Wallet does nothing on iOS 13.4+ | The `passTypeIdentifier` / `serialNumber` pair doesn't match a pass in the user's Wallet (e.g., the pass was deleted between Refresh and the tap) | Tap Refresh on My Passes and try again. |
| Android / Web shows the IOSOnlyBanner but also a "no module found" red-screen | A test-time mock leaked into the runtime build; verify the platform-split bridge variant is being resolved correctly | Inspect the bundler's resolve graph; should pick `.web.ts` on web and `.android.ts` on Android. |
| Plugin test fails after adding 036 with "entitlements key missing" for a prior feature | A composition-order bug introduced by a fixture-loading change | The composition test asserts byte-equality of every prior plugin's entitlement contributions; the failing diff identifies the offending key. |

## 6. References

- [spec.md](./spec.md) — full functional + non-functional spec
- [plan.md](./plan.md) — architecture, structure, decisions
- [research.md](./research.md) — R-A through R-G
- [data-model.md](./data-model.md) — entities + typed errors
- [contracts/passkit-bridge.md](./contracts/passkit-bridge.md) — JS bridge surface
- [contracts/passkit-lab-manifest.md](./contracts/passkit-lab-manifest.md) — registry manifest
- [contracts/with-passkit-plugin.md](./contracts/with-passkit-plugin.md) — config plugin
- [contracts/usePassKit-hook.md](./contracts/usePassKit-hook.md) — hook surface
- Apple — [Wallet Developer Guide](https://developer.apple.com/documentation/walletpasses) (informational; no verbatim copy in this repo)
