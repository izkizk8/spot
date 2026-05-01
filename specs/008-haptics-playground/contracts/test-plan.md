# Contract — Test Plan

This document maps user stories to test files and codifies the recipes
that are too fiddly to leave to per-test discovery (notably: jest fake
timers for the 120 ms sequencer assertion, and the platform-branch mock
pattern in the driver tests).

---

## Story → test mapping

| Story | Test files | What is asserted |
|---|---|---|
| **1** Single-fire haptics | `haptic-driver.test.ts`, `components/HapticButton.test.tsx`, `screen.test.tsx`, `manifest.test.ts` | Routing table (R10 / driver contract); button press calls driver with right args; pulse animates; module appears in registry |
| **2** Composer | `components/PatternSequencer.test.tsx`, `screen.test.tsx` | Cycle order (FR-010); play empty = no-op (FR-015); play-with-spacing (FR-013, SC-004); cancel on re-press / unmount (FR-016) |
| **3** Presets | `presets-store.test.ts`, `components/PresetList.test.tsx`, `screen.test.tsx` | CRUD + error tolerance + N-numbering; tap-to-play; delete; survives store-mock reset (FR-023) |
| **4** Cross-platform | `haptic-driver.test.ts` (web case), `screen.test.tsx` (banner) | Web no-op; banner only on web |

The global `test/unit/modules/manifest.test.ts` (from spec 006) will pick
up the new manifest automatically and assert the registry-wide invariants
(unique id, kebab-case, etc.). The per-module `manifest.test.ts` adds the
008-specific invariants (id literally `'haptics-playground'`, all three
platforms, no `minIOS`).

---

## Driver test — mocking `expo-haptics` and `Platform`

```ts
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  impactAsync: jest.fn().mockResolvedValue(undefined),
  selectionAsync: jest.fn().mockResolvedValue(undefined),
  NotificationFeedbackType: { Success: 'Success', Warning: 'Warning', Error: 'Error' },
  ImpactFeedbackStyle: {
    Light: 'Light', Medium: 'Medium', Heavy: 'Heavy',
    Soft: 'Soft', Rigid: 'Rigid',
  },
}));
```

For the web case, override `Platform.OS` per-test:

```ts
import { Platform } from 'react-native';
// inside the test:
Object.defineProperty(Platform, 'OS', { configurable: true, get: () => 'web' });
```

After the assertion, restore via `afterEach` so other tests in the file
see the default `'ios'` from `jest-expo`.

---

## Sequencer test — jest fake timers @ 120 ms

```ts
jest.useFakeTimers();

const onCellFire = jest.fn();
render(<PatternSequencer initial={mixedPattern} onCellFire={onCellFire} />);

fireEvent.press(screen.getByRole('button', { name: /play/i }));

// Cell 0 fires synchronously (or on the first microtask)
await act(async () => { await Promise.resolve(); });
expect(onCellFire).toHaveBeenCalledTimes(1);

// Each subsequent cell fires after 120ms
for (let i = 1; i < nonEmptyCount; i++) {
  await act(async () => { jest.advanceTimersByTime(120); await Promise.resolve(); });
  expect(onCellFire).toHaveBeenCalledTimes(i + 1);
}

jest.useRealTimers();
```

For the *cancel-on-re-press* case (FR-016): start playback, advance one
tick, press Play again, advance another 1000 ms, assert `onCellFire` was
not called any more times.

For the *cancel-on-unmount* case: same pattern but call `unmount()`
between the two `advanceTimersByTime` calls.

---

## Store test — using the AsyncStorage jest mock

The shared `test/setup.ts` already wires
`@react-native-async-storage/async-storage/jest/async-storage-mock`. So the
store tests just need a `beforeEach` cleanup:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';

beforeEach(async () => { await AsyncStorage.clear(); });
```

For the corrupt-JSON case, write directly:

```ts
await AsyncStorage.setItem('spot.haptics.presets', '{not-json');
expect(await list()).toEqual([]);
```

For the partial-corruption case:

```ts
await AsyncStorage.setItem('spot.haptics.presets', JSON.stringify([
  { id: 'a', name: 'Preset 1', pattern: validEightCells, createdAt: '...' },
  { id: 42 /* wrong type */ },
]));
const out = await list();
expect(out).toHaveLength(1);
expect(out[0].id).toBe('a');
```

For the write-failure case:

```ts
jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disk full'));
await expect(save(somePattern)).rejects.toMatchObject({ code: 'write-failed' });
```

---

## Screen integration test — what to render and what to query

```ts
import { render, screen, fireEvent } from '@testing-library/react-native';
import { HapticsPlaygroundScreen } from '@/modules/haptics-playground/screen';

it('renders the three sections + composer + presets list', () => {
  render(<HapticsPlaygroundScreen />);
  expect(screen.getByText(/notification/i)).toBeOnTheScreen();
  expect(screen.getByText(/impact/i)).toBeOnTheScreen();
  expect(screen.getByText(/selection/i)).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: /play/i })).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: /save preset/i })).toBeOnTheScreen();
});

it('shows the web banner only on web', () => {
  Object.defineProperty(Platform, 'OS', { configurable: true, get: () => 'web' });
  render(<HapticsPlaygroundScreen />);
  expect(screen.getByText(/haptics not supported on this platform/i))
    .toBeOnTheScreen();
});
```

Driver is mocked at module scope so the screen test can also assert that
pressing the *Success* button triggered `play('notification', 'success')`.
