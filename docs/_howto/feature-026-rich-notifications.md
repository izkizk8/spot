---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode (optional; expo-notifications works in dev client / Expo Go)
  - iPhone running iOS 10+
  - Apple Developer account (free tier sufficient for local; push requires paid + APNs key)
---

# How to verify Rich Notifications on iPhone

## Goal
Confirm local notifications are scheduled and delivered, notification content
(title, body, badge, sound) renders correctly, push notifications arrive via APNs
on a paid-account build, and notification actions (inline reply, category buttons)
are functional.

## Prerequisites
- Node 20+, pnpm; `pnpm install` already run
- `expo-notifications` installed (`npx expo install expo-notifications`)
- `with-rich-notifications` plugin registered in `app.json`
- For push: paid Apple Developer account + APNs auth key configured in Expo EAS

## Steps
1. Build the JS layer:
   ```bash
   pnpm install && pnpm check
   ```
2. Generate native project and build:
   ```bash
   npx expo prebuild --clean
   pnpm ios:ipa
   ```
3. Install the IPA per [sideload-iphone.md](sideload-iphone.md).
4. In the app, navigate to **"Notifications Lab"** in the Modules tab.
5. Tap **Request Permission** — grant notification permission.
6. Tap **Schedule Local** → enter "5 s" delay → confirm iOS banner appears in ~5 s.
7. Lock the screen and repeat — notification appears on Lock Screen.
8. Long-press the notification → confirm Action buttons (if configured category) appear.
9. Tap **Trigger Repeating** → confirm notifications arrive at configured interval.
10. Tap **Cancel All** → confirm pending notifications are cleared (check notification
    center — no pending items).

## Verify
- Notification permission prompt appears on first request
- Local notification banner appears in ~5 s with title, body, and sound
- Lock-screen notification displays correctly
- Category action buttons appear on long-press
- Cancel All removes all pending local notifications
- Push token is displayed in the screen (physical device only)

## Troubleshooting
- **Banner never appears** → confirm permission granted in
  Settings → Notifications → Spot; also check Focus Modes
- **Push token is null** → simulator does not support APNs push tokens;
  use a physical device
- **Action buttons not appearing** → notification category must be registered
  at app launch before scheduling with that category ID

## Implementation references
- Spec: `specs/026-rich-notifications/spec.md`
- Plan: `specs/026-rich-notifications/plan.md`
- Module: `src/modules/notifications-lab/`
- Native bridge: `src/native/notifications.ts`
- Plugin: `plugins/with-rich-notifications/`

## See Also
- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows