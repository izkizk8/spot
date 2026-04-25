# Quickstart: EAS Build Unsigned IPA for Sideloading

## Build Unsigned IPA (Free, No Apple Credentials)

```bash
npx eas build --platform ios --profile sideload --non-interactive
# Wait ~15 min → download .ipa from expo.dev dashboard
# Uses custom build YAML — no Apple credentials needed
```

**Verified**: Build [cdb774a4](https://expo.dev/accounts/izkizk8/projects/spot/builds/cdb774a4-16b5-4e70-9c6a-ecddeb891663) succeeded → [IPA download](https://expo.dev/artifacts/eas/rpmUqmvTf8qwjyi8dWSzKi.ipa)

## Sideload to iPhone (Windows)

1. Download `.ipa` from expo.dev
2. Open [Sideloadly](https://sideloadly.io/) → drag `.ipa` → enter free Apple ID → Start
3. On iPhone: Settings → General → VPN & Device Management → Trust
4. Re-sign every 7 days (same IPA, no rebuild)

## Verify Configuration

```bash
# Check eas.json has all profiles
Select-String -Path eas.json -Pattern "development|sideload|production"

# Check app.json has bundleIdentifier
Select-String -Path app.json -Pattern "bundleIdentifier"

# Check custom build YAML exists
Test-Path .eas/build/unsigned-ios.yml

# Check guide exists
Test-Path docs/eas-build-guide.md
```

## Build Simulator App (Free, Mac Needed to Run)

```bash
npx eas build --platform ios --profile development --non-interactive
# Wait ~15 min → download .tar.gz from expo.dev dashboard
```

## Success Criteria Checklist

- [x] SC-001: `eas.json` has `development` and `sideload` profiles ✅
- [x] SC-002: `app.json` has `ios.bundleIdentifier` set to `com.izkizk8.spot` ✅
- [x] SC-003: builds completed on EAS dashboard (simulator 50cc8ed9 + IPA cdb774a4) ✅
- [x] SC-004: `docs/eas-build-guide.md` exists with unsigned IPA workflow ✅
- [ ] SC-003: Simulator build queued/completed on EAS dashboard
- [ ] SC-004: `docs/eas-build-guide.md` exists with full workflow guide
