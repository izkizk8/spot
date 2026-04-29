# Contract: `with-quick-actions` plugin Info.plist output

**Feature**: 039-quick-actions
**Plugin**: `plugins/with-quick-actions/index.ts`
**Consumed by**: iOS `prebuild` → `ios/spot/Info.plist`

---

## Exact `UIApplicationShortcutItems` array

After running `withInfoPlist`, the resulting Info.plist contains:

```xml
<key>UIApplicationShortcutItems</key>
<array>
  <dict>
    <key>UIApplicationShortcutItemType</key>
    <string>open-liquid-glass</string>
    <key>UIApplicationShortcutItemTitle</key>
    <string>Open Liquid Glass</string>
    <key>UIApplicationShortcutItemSubtitle</key>
    <string>Material playground</string>
    <key>UIApplicationShortcutItemIconType</key>
    <string>UIApplicationShortcutIconTypeSymbol</string>
    <key>UIApplicationShortcutItemIconSymbolName</key>
    <string>drop.fill</string>
    <key>UIApplicationShortcutItemUserInfo</key>
    <dict>
      <key>route</key>
      <string>/modules/liquid-glass-playground</string>
    </dict>
  </dict>
  <dict>
    <key>UIApplicationShortcutItemType</key>
    <string>open-sensors</string>
    <key>UIApplicationShortcutItemTitle</key>
    <string>Open Sensors</string>
    <key>UIApplicationShortcutItemSubtitle</key>
    <string>Motion & device data</string>
    <key>UIApplicationShortcutItemIconType</key>
    <string>UIApplicationShortcutIconTypeSymbol</string>
    <key>UIApplicationShortcutItemIconSymbolName</key>
    <string>gauge</string>
    <key>UIApplicationShortcutItemUserInfo</key>
    <dict>
      <key>route</key>
      <string>/modules/sensors-playground</string>
    </dict>
  </dict>
  <dict>
    <key>UIApplicationShortcutItemType</key>
    <string>open-audio-lab</string>
    <key>UIApplicationShortcutItemTitle</key>
    <string>Open Audio Lab</string>
    <key>UIApplicationShortcutItemSubtitle</key>
    <string>Recording demo</string>
    <key>UIApplicationShortcutItemIconType</key>
    <string>UIApplicationShortcutIconTypeSymbol</string>
    <key>UIApplicationShortcutItemIconSymbolName</key>
    <string>mic.fill</string>
    <key>UIApplicationShortcutItemUserInfo</key>
    <dict>
      <key>route</key>
      <string>/modules/audio-lab</string>
    </dict>
  </dict>
  <dict>
    <key>UIApplicationShortcutItemType</key>
    <string>add-mood-happy</string>
    <key>UIApplicationShortcutItemTitle</key>
    <string>Add Mood: Happy</string>
    <key>UIApplicationShortcutItemSubtitle</key>
    <string>Quick journal entry</string>
    <key>UIApplicationShortcutItemIconType</key>
    <string>UIApplicationShortcutIconTypeSymbol</string>
    <key>UIApplicationShortcutItemIconSymbolName</key>
    <string>face.smiling</string>
    <key>UIApplicationShortcutItemUserInfo</key>
    <dict>
      <key>route</key>
      <string>/modules/app-intents-lab</string>
      <key>mood</key>
      <string>happy</string>
    </dict>
  </dict>
</array>
```

In JS terms (the structure the test asserts after running the plugin):

```ts
[
  { UIApplicationShortcutItemType: 'open-liquid-glass', UIApplicationShortcutItemTitle: 'Open Liquid Glass', UIApplicationShortcutItemSubtitle: 'Material playground', UIApplicationShortcutItemIconType: 'UIApplicationShortcutIconTypeSymbol', UIApplicationShortcutItemIconSymbolName: 'drop.fill', UIApplicationShortcutItemUserInfo: { route: '/modules/liquid-glass-playground' } },
  { UIApplicationShortcutItemType: 'open-sensors',       UIApplicationShortcutItemTitle: 'Open Sensors',       UIApplicationShortcutItemSubtitle: 'Motion & device data',  UIApplicationShortcutItemIconType: 'UIApplicationShortcutIconTypeSymbol', UIApplicationShortcutItemIconSymbolName: 'gauge',       UIApplicationShortcutItemUserInfo: { route: '/modules/sensors-playground' } },
  { UIApplicationShortcutItemType: 'open-audio-lab',     UIApplicationShortcutItemTitle: 'Open Audio Lab',     UIApplicationShortcutItemSubtitle: 'Recording demo',        UIApplicationShortcutItemIconType: 'UIApplicationShortcutIconTypeSymbol', UIApplicationShortcutItemIconSymbolName: 'mic.fill',    UIApplicationShortcutItemUserInfo: { route: '/modules/audio-lab' } },
  { UIApplicationShortcutItemType: 'add-mood-happy',     UIApplicationShortcutItemTitle: 'Add Mood: Happy',    UIApplicationShortcutItemSubtitle: 'Quick journal entry',   UIApplicationShortcutItemIconType: 'UIApplicationShortcutIconTypeSymbol', UIApplicationShortcutItemIconSymbolName: 'face.smiling', UIApplicationShortcutItemUserInfo: { route: '/modules/app-intents-lab', mood: 'happy' } },
]
```

## Idempotency guarantee (SC-7, FR-003)

```text
plugin(plugin(config)) deep-equals plugin(config)
```

Implementation:

```ts
const have = new Set(
  ((cfg.modResults.UIApplicationShortcutItems as Item[] | undefined) ?? [])
    .map((i) => i.UIApplicationShortcutItemType),
);
const merged = [
  ...((cfg.modResults.UIApplicationShortcutItems as Item[] | undefined) ?? []),
  ...DEFAULTS_AS_PLIST_ITEMS.filter((d) => !have.has(d.UIApplicationShortcutItemType)),
];
cfg.modResults.UIApplicationShortcutItems = merged;
```

## What the plugin does **NOT** touch

- **No usage-description key**. Quick Actions require none.
- **No other Info.plist keys**.
- **No `ios.entitlements`**.
- **No `AppDelegate.swift`** modifications (the runtime path is owned
  entirely by `expo-quick-actions`).

## Plugin-count assertion in `test/unit/plugins/with-mapkit/index.test.ts`

Line 64-65 must be updated:

```diff
-    // After feature 037, plugins.length should be 28 (added with-eventkit after with-passkit)
-    expect(plugins.length).toBe(29);
+    // After feature 039, plugins.length should be 30 (added with-quick-actions after with-contacts)
+    expect(plugins.length).toBe(30);
```

The mapkit-index assertion on line 71 (`mapkitIndex === 14`) is
**unchanged** — `with-quick-actions` is appended at the end of the
plugins array, so all prior indexes are stable.
