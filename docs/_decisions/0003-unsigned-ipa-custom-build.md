---
status: accepted
date: 2026-04-26
deciders: project owner
---

# 0003. Use a custom EAS build YAML for unsigned iOS IPA (free sideload)

## Context

We want to test on a physical iPhone from a Windows dev machine without paying for the Apple Developer Program ($99/yr). The plan: produce an unsigned `.ipa` on EAS (free plan), then re-sign locally with Sideloadly + free Apple ID.

The standard EAS iOS pipeline always runs `IosCredentialsManager.prepare` for non-simulator builds, which crashes without Apple credentials. The flag `withoutCredentials: true` only suppresses the local CLI prompt — it does not skip the remote credential restore.

## Decision

Use a **custom EAS build workflow** (`.eas/build/unsigned-ios.yml`) for the `sideload` profile. The custom YAML replaces the entire pipeline with explicit steps that:

- Build with `xcodebuild -sdk iphoneos` targeting arm64 device binary
- Set `CODE_SIGNING_REQUIRED=NO`
- Skip every Apple credential step
- Package the resulting `.app` into an unsigned `.ipa`

`eas.json` `sideload` profile:

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

## Alternatives Considered

- **Standard pipeline + `withoutCredentials: true`** — fails because the flag only affects the local prompt, not the remote credential restore step.
- **Pay for Apple Developer Program** — defeats the goal; rejected for personal/test use.
- **Simulator build only** — produces `.app` (.tar.gz) that only runs on macOS Simulator; doesn't give us a physical-device IPA.
- **Expo Go only** — instant but sandboxed; can't test custom native modules.

## Consequences

- ✅ Free physical-device installs from Windows
- ✅ ~15 min build time on free EAS plan (15 builds/month)
- ✅ Same IPA can be re-signed every 7 days with no rebuild
- ⚠️ Free Apple ID limits: 7-day cert expiry, max 3 active sideloaded apps, no push/iCloud/Sign-in capabilities
- ⚠️ Custom YAML is unsupported by future EAS pipeline changes — re-validate on EAS major bumps
- 🔁 Revisit if EAS adds first-class "unsigned build" support, or if we get a paid Developer account

## References

- [docs/_howto/sideload-iphone.md](../_howto/sideload-iphone.md) — operator walkthrough
- [docs/eas-sideload_profile.md](../eas-sideload_profile.md) — generated module reference
- `.eas/build/unsigned-ios.yml`, `eas.json`
- Verified working build: <https://expo.dev/accounts/izkizk8/projects/spot/builds/cdb774a4-16b5-4e70-9c6a-ecddeb891663>
