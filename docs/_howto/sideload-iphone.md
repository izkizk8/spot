---
last_verified: 2026-04-26
prerequisites:
  - Windows PC (or macOS) with USB cable
  - iPhone with a free Apple ID signed in
  - Sideloadly installed (https://sideloadly.io/)
  - iTunes for Windows installed (required for USB device communication)
  - EAS account + this project linked (`eas init`)
---

# How to install a free unsigned IPA on iPhone (Windows → iOS sideload)

## Goal

Install this app on a physical iPhone from a Windows machine, **without paying for the Apple Developer Program**, by building an unsigned IPA on EAS (free plan) and re-signing it locally with Sideloadly + a free Apple ID.

## Prerequisites

- Windows PC (or macOS) with USB cable
- iPhone with a free Apple ID signed in
- [Sideloadly](https://sideloadly.io/) installed
- iTunes for Windows installed (USB device transport)
- EAS CLI logged in: `npm i -g eas-cli && eas login && eas init`

> **Why this is needed**: see ADR [0003](../_decisions/0003-unsigned-ipa-custom-build.md). TL;DR — `withoutCredentials: true` alone doesn't skip EAS's remote credential restore, so we use a custom build YAML.

## Steps

### 1. Build unsigned IPA

```bash
pnpm ios:ipa
# equivalent to: npx eas build --platform ios --profile sideload
```

Build time: ~15 min. Free plan: 15 builds/month.

### 2. Download the `.ipa`

- Open <https://expo.dev/> → your project → **Builds**
- Click the latest `sideload` build → **Download** `.ipa`
- (Or copy the download URL printed at the end of the build)

### 3. Re-sign + install via Sideloadly

1. Connect iPhone via USB
2. Open **Sideloadly**
3. Drag the `.ipa` file in
4. Enter your free Apple ID + password
5. Click **Start**

Sideloadly will create a free 7-day developer certificate, re-sign the IPA, and install it.

### 4. Trust the developer certificate on iPhone

On iPhone: **Settings → General → VPN & Device Management → Developer App → \<your Apple ID\>** → **Trust**.

### 5. (Every 7 days) Re-sign

Free Apple ID certificates expire after 7 days. When the app stops working:

1. Connect iPhone via USB
2. Open Sideloadly → drag the **same `.ipa`** (no rebuild needed)
3. Click **Start** → re-trust on device

Alternative: [AltStore](https://altstore.io/) auto-renews over Wi-Fi. See [`altstore-source.md`](altstore-source.md) for the OTA install path.

## Verify

Open the app on the iPhone — it launches and runs the latest bundled code.

## Troubleshooting

- **Custom build fails** → check the failed step's logs on expo.dev
- **Sideloadly "provision.cpp:81" error** → update iTunes, restart Sideloadly
- **"Untrusted Developer" alert on iPhone** → Settings → General → VPN & Device Management → Trust
- **"Maximum 3 apps" error from Apple** → uninstall an existing sideloaded app, or use a different Apple ID
- **Sideloadly can't see device** → reinstall iTunes for Windows; try a different USB cable/port
- **App stopped working after a week** → re-run Steps 3 + 4; no rebuild needed
- **Black screen / instant exit on launch** → the app crashed before its UI rendered. Most often this is a privileged entitlement (FamilyControls, HealthKit, HomeKit, WeatherKit, Apple Pay, PassKit, CarPlay, iCloud, App Clips, ...) or an embedded app extension that free-tier sideload signing cannot satisfy. Build the dev-client diagnostic IPA instead:

  ```bash
  pnpm ios:ipa:dev
  # equivalent to: npx eas build --platform ios --profile sideload-dev
  ```

  This profile uses [`app.config.ts`](../../app.config.ts) to strip every local `./plugins/with-*` entry plus `associatedDomains` (gated on `EAS_BUILD_PROFILE === 'sideload-dev'`), so the resulting IPA installs and launches into the `expo-dev-client` launcher reliably. The IPA is built in Debug with the JS bundle embedded in dev mode (`__DEV__ === true`).

  After installing it via Sideloadly:
  - You'll land in the dev-client launcher (Home / Updates / Settings tabs).
  - Stream the full app's JS over Metro so you don't have to rebuild for every change:

    ```bash
    pnpm start --dev-client --tunnel
    ```

    Then either scan the terminal QR code with iPhone's Camera app, or paste the displayed `https://*.exp.direct/...` URL into the launcher's "Enter URL manually" field.
  - LogBox / RedBox surface any JS warning or error directly on screen.
  - Shake the device to open the dev menu (inspector, perf monitor, in-app logs).
  - Native modules from npm dependencies remain auto-linked in the IPA; only APIs requiring stripped entitlements (HealthKit etc.) throw at call time, which usually pinpoints the offending plugin.

  This profile is for diagnostics only — the binary is larger and slower than the Release `sideload` profile, and `app.config.ts` reverts to the full plugin set for any other build profile.

## Free Apple ID Limits

- Apps expire after 7 days
- Max 3 active sideloaded apps per Apple ID
- No push notifications, iCloud, Sign in with Apple, or other entitled capabilities

## See Also

- ADR [0003](../_decisions/0003-unsigned-ipa-custom-build.md) — why we use a custom build YAML
- [`altstore-source.md`](altstore-source.md) — OTA install path via AltStore source (no USB after first setup)
- Generated profile: [eas-sideload_profile.md](../eas-sideload_profile.md) — full EAS sideload module reference
- EAS docs: <https://docs.expo.dev/build/introduction/>, <https://docs.expo.dev/custom-builds/schema/>
