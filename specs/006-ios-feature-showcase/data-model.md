# Phase 1 Data Model: iOS Feature Showcase

All entities here are **in-memory TypeScript types**. No remote storage, no
database, no schema migrations. The single persistent value is the theme
preference, written to AsyncStorage as a UTF-8 string.

## Entities

### `ModuleManifest`

The typed contract every module exports as its default. Authored at
`src/modules/types.ts`. Full TypeScript declaration is in
[`contracts/module-manifest.md`](./contracts/module-manifest.md).

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | Stable, unique, kebab-case. Used in route `/modules/[id]` and as React key. |
| `title` | `string` | yes | Human-readable card title. |
| `description` | `string` | yes | One-sentence card subtitle. |
| `icon` | `{ ios: SFSymbolName; fallback: string }` | yes | iOS uses SF Symbol via `expo-symbols`. `fallback` is a string identifier rendered as a text glyph or routed to a future icon set on Android/web. |
| `platforms` | `ReadonlyArray<'ios' \| 'android' \| 'web'>` | yes | Non-empty subset. |
| `minIOS` | `string` | no | Semver-like, e.g. `"17.0"`. If present and current iOS version < `minIOS`, module is shown as unavailable on iOS. |
| `render` | `() => ReactNode` | yes | The module screen's root component invocation. Called by `app/modules/[id].tsx`. |

**Validation rules** (enforced by `manifest.test.ts`):

- `id` matches `/^[a-z][a-z0-9-]*$/`.
- `platforms.length >= 1` and every element ∈ `{ 'ios', 'android', 'web' }`.
- `minIOS`, if present, matches `/^\d+(\.\d+){0,2}$/`.
- `render` is a function.

### `ModuleRegistry`

| Field | Type | Notes |
|---|---|---|
| `MODULES` | `readonly ModuleManifest[]` | Source-order list, exported from `src/modules/registry.ts`. |

**Invariants** (enforced by `registry.test.ts`):

- `MODULES.map(m => m.id)` has no duplicates.
- Order is deterministic across runs (source-order of imports).
- An empty `MODULES` array is valid (FR-012 — Modules tab renders empty
  state).

### `ThemePreference`

| Field | Type | Notes |
|---|---|---|
| value | `'system' \| 'light' \| 'dark'` | Persisted; default `'system'`. |

**Storage**: AsyncStorage key `spot.theme.preference`. Written on user
change; read once at boot. Failure to read → fall back to `'system'`.
Failure to write → log to dev console only; in-memory state still updates
(FR-024).

### `EffectiveColorScheme` (derived; not persisted)

| Input | Output |
|---|---|
| `preference === 'light'` | `'light'` |
| `preference === 'dark'` | `'dark'` |
| `preference === 'system'` | OS color scheme via `useColorScheme()` (defaults to `'light'` if `'unspecified'`) |

This derivation lives in `src/theme/preference-provider.tsx` and is the
sole producer of the value `useTheme()` indexes into `Colors`.

## State Transitions

### Theme preference

```text
            setPreference('light')
  system  ─────────────────────────►  light
    ▲                                   │
    │ setPreference('system')           │ setPreference('dark')
    │                                   ▼
   dark  ◄─────────────────────────────  dark
            setPreference('dark')
```

(Any state can transition to any other state via `setPreference`.)

### Module availability (per-card, per-platform)

```text
                       ┌── platforms ∋ currentPlatform ──► AVAILABLE
manifest, platform ───►┤
                       └── platforms ∌ currentPlatform ──► UNAVAILABLE
                                                          (badge shown,
                                                           tap → graceful
                                                           "not on this
                                                           platform" view)

iOS additionally checks: minIOS present AND deviceIOS < minIOS
                                                       ──► UNAVAILABLE
```

## Relationships

- `ModuleRegistry` aggregates `ModuleManifest` (one-to-many, compile-time).
- `ThemePreference` is independent of modules; modules consume the
  resolved theme via the same `useTheme()` / `ThemedText` / `ThemedView`
  API as the shell.
