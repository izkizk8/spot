# EAS Build Guide: Windows → iOS Sideloading (Free)

## TL;DR

| Method | Cost | Build Time | Output | Physical iPhone? |
|--------|------|-----------|--------|-----------------|
| **Unsigned IPA + Sideloadly** ⭐ | Free | ~15 min | `.ipa` | ✅ Yes |
| Simulator build | Free | ~15 min | `.app` (.tar.gz) | ❌ Mac only |
| Expo Go | Free | None | Dev server | ✅ Yes (sandbox) |

> **This project uses a custom build workflow** to produce an unsigned IPA on EAS (free plan, no Apple credentials). The IPA is then re-signed with Sideloadly using a free Apple ID and installed on iPhone via USB.

---

## Method 1: Unsigned IPA Build + Sideloadly ⭐ Recommended

### Step 1: Build Unsigned IPA

```bash
npx eas build --platform ios --profile sideload
```

This uses a **custom build workflow** (`.eas/build/unsigned-ios.yml`) that:
- Builds with `xcodebuild -sdk iphoneos` targeting arm64 device binary
- Skips all Apple credential steps (`CODE_SIGNING_REQUIRED=NO`)
- Packages the `.app` into an unsigned `.ipa`
- Uploads to EAS dashboard for download

**Build time**: ~15 minutes. **Cost**: Free (15 builds/month on free EAS plan).

The `sideload` profile in `eas.json`:
```json
{
  "sideload": {
    "ios": {
      "withoutCredentials": true,
      "simulator": false,
      "config": "unsigned-ios.yml"
    }
  }
}
```

### Step 2: Download the IPA

After the build completes:
- Visit [expo.dev](https://expo.dev/) → your project → Builds
- Click **Download** to get the `.ipa` file
- Or use the download URL from terminal output

### Step 3: Re-sign & Install with Sideloadly

1. **Install Sideloadly** from [sideloadly.io](https://sideloadly.io/)
2. **Install iTunes for Windows** (required for USB communication)
3. **Connect your iPhone** via USB cable
4. **Open Sideloadly**
5. **Drag the `.ipa` file** into Sideloadly
6. **Enter your free Apple ID** and password
7. Click **Start**

Sideloadly will:
- Create a free development certificate with your Apple ID
- Re-sign the IPA with that certificate
- Install the app on your connected iPhone

### Step 4: Trust the Developer Certificate

1. On iPhone: **Settings → General → VPN & Device Management**
2. Find your Apple ID email under "Developer App"
3. Tap **Trust "[your email]"** → Confirm

Now open the app — it runs!

### Step 5: Re-sign Every 7 Days

Free Apple ID certificates expire after 7 days. When the app stops working:

1. Connect iPhone via USB
2. Open Sideloadly → drag the **same `.ipa`** (no rebuild needed)
3. Click Start → re-signs with fresh certificate
4. Trust certificate again (Step 4)

**Alternative**: [AltStore](https://altstore.io/) can auto-renew in the background over Wi-Fi.

---

## Free Apple ID Limitations (via Sideloadly)

- Apps expire after **7 days** — must re-sign weekly
- Maximum **3 active sideloaded apps** per Apple ID
- No push notifications, iCloud, Sign in with Apple, or other capabilities
- Must trust developer certificate on device after each re-sign

---

## Method 2: Simulator Build (Free, Needs Mac to Run)

```bash
npx eas build --platform ios --profile development
```

Produces a `.tar.gz` with a simulator `.app` bundle. Only runs on iOS Simulator (macOS).

---

## Method 3: Expo Go (Free, No Build)

```bash
npx expo start
# Scan QR with Expo Go on iPhone
```

Instant, but runs inside the Expo Go sandbox (no custom native modules).

---

## One-Time Setup

```bash
npm install -g eas-cli    # Install EAS CLI
eas login                 # Login to Expo account
eas init                  # Link project to EAS
```

---

## Build Profiles Reference

| Profile | Purpose | Output | Credentials | Command |
|---------|---------|--------|-------------|---------|
| `development` | iOS Simulator | `.app` (.tar.gz) | None | `npx eas build --platform ios --profile development` |
| `sideload` | Physical device (unsigned) | `.ipa` | None (custom YAML) | `npx eas build --platform ios --profile sideload` |
| `production` | App Store | `.ipa` (signed) | Paid Apple Developer ($99/yr) | `npx eas build --platform ios --profile production` |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Custom build fails | Check build logs on expo.dev for the specific step that failed |
| Sideloadly "provision.cpp:81" error | Update iTunes to latest version; restart Sideloadly |
| "Untrusted Developer" on iPhone | Settings → General → VPN & Device Management → Trust |
| App stops working after 7 days | Re-sign with Sideloadly (same IPA, no rebuild needed) |
| "Maximum 3 apps" error | Remove a sideloaded app, or use a different Apple ID |
| Sideloadly can't detect device | Install/reinstall iTunes for Windows; try different USB cable/port |

---

## Quick Reference

```bash
# === Build unsigned IPA (free, no Apple credentials) ===
npx eas build --platform ios --profile sideload

# === Then on Windows ===
# 1. Download .ipa from expo.dev
# 2. Open Sideloadly → drag .ipa → enter Apple ID → Start
# 3. On iPhone: Settings → VPN & Device Management → Trust

# === Re-sign (every 7 days, no rebuild) ===
# Same .ipa in Sideloadly → Start → Trust again

# === Simulator build (free, Mac needed) ===
npx eas build --platform ios --profile development

# === Expo Go (instant, sandbox) ===
npx expo start
```

---

## How It Works (Technical)

The `sideload` profile uses a **custom build YAML** (`.eas/build/unsigned-ios.yml`) instead of the standard EAS pipeline. This is necessary because:

1. The standard pipeline always runs `IosCredentialsManager.prepare` for non-simulator builds, which crashes without Apple credentials
2. `withoutCredentials: true` only suppresses the local CLI prompt — it doesn't skip the remote credential restore
3. The custom YAML replaces the entire pipeline with explicit steps that skip credentials and build with `CODE_SIGNING_REQUIRED=NO`

**Verified working**: Build [cdb774a4](https://expo.dev/accounts/izkizk8/projects/spot/builds/cdb774a4-16b5-4e70-9c6a-ecddeb891663) — free EAS plan, no Apple credentials, produced unsigned `.ipa`.

---

## Official Documentation References

| Topic | URL |
|-------|-----|
| EAS Build Overview | [docs.expo.dev/build/introduction](https://docs.expo.dev/build/introduction/) |
| eas.json Schema | [docs.expo.dev/eas/json](https://docs.expo.dev/eas/json/) |
| Custom Builds Schema | [docs.expo.dev/custom-builds/schema](https://docs.expo.dev/custom-builds/schema/) |
| iOS Build Process | [docs.expo.dev/build-reference/ios-builds](https://docs.expo.dev/build-reference/ios-builds/) |
| Sideloadly | [sideloadly.io](https://sideloadly.io/) |
| AltStore | [altstore.io](https://altstore.io/) |
