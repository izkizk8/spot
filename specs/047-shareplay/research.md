# Research — 047-shareplay

## Decision: skip the Expo config plugin

### Question

Does a custom `GroupActivity` showcase need an Expo config plugin
to inject Info.plist keys or entitlements?

### Findings

The Apple GroupActivities framework was introduced in iOS 15. A
custom `GroupActivity` (a Swift struct conforming to the
`GroupActivity` protocol) is registered purely via Swift code —
the OS picks it up when it sees the type vended through a
`SharePlay` UIActivity, a `SharePlayActivityViewController`, or
the `groupActivity` SwiftUI modifier.

Apple's documentation for "Defining Your App's SharePlay Experience"
lists no required Info.plist keys for the basic case. The
`NSGroupActivitiesUsageDescription` pattern that exists for some
frameworks **does not exist** for GroupActivities — the system
dialogue is presented by the OS during the FaceTime call without
a per-app description.

Entitlements such as `com.apple.developer.group-session` only
appear when an app participates in **automatic SharePlay**
(initiating SharePlay from outside FaceTime). The minimum-viable
showcase only registers + joins activities that the user
explicitly starts from the SharePlay menu, so this entitlement is
**not required**.

### Decision

**Skip the plugin.** No `plugins/with-shareplay/` directory is
created. The `app.json` plugins array is unchanged (length stays
at 37). The `with-mapkit` plugin-count test is left at the value
asserted by feature 046 (37).

### Alternatives considered

1. **No-op passthrough plugin.** Rejected — adds an empty file
   that contributes nothing; future readers would have to verify
   the no-op claim by reading the source. A skipped plugin with
   a research doc is cheaper to audit.
2. **Add `com.apple.developer.group-session` entitlement.**
   Rejected — only required for automatic SharePlay, which is
   out of scope for this educational lab.
3. **Add an Info.plist banner advertising SharePlay support.**
   Rejected — no such key exists; SharePlay support is signalled
   by the Swift `GroupActivity` registration alone.
