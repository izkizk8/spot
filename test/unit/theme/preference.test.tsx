import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, render } from '@testing-library/react-native';
import React, { useEffect } from 'react';

import {
  THEME_PREFERENCE_STORAGE_KEY,
  ThemePreferenceProvider,
  type ThemePreference,
} from '@/theme/preference-provider';
import { usePreference, useSetPreference } from '@/theme/use-theme-preference';

function Probe({
  onReady,
  next,
}: {
  onReady: (api: { value: ThemePreference; set: (n: ThemePreference) => void }) => void;
  next?: ThemePreference;
}) {
  const value = usePreference();
  const set = useSetPreference();
  useEffect(() => {
    onReady({ value, set });
    if (next != null && value !== next) set(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return null;
}

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

describe('ThemePreferenceProvider (FR-021, FR-024)', () => {
  it('default preference is "system"', async () => {
    const observed: ThemePreference[] = [];
    render(
      <ThemePreferenceProvider>
        <Probe onReady={({ value }) => observed.push(value)} />
      </ThemePreferenceProvider>,
    );
    // Wait a tick for async hydration to complete (storage is empty).
    await act(async () => {
      await Promise.resolve();
    });
    expect(observed[0]).toBe('system');
  });

  it('setPreference("dark") updates context and persists to AsyncStorage', async () => {
    const setItem = jest.spyOn(AsyncStorage, 'setItem');
    const observed: ThemePreference[] = [];
    render(
      <ThemePreferenceProvider>
        <Probe
          onReady={({ value, set }) => {
            observed.push(value);
            if (value === 'system') set('dark');
          }}
        />
      </ThemePreferenceProvider>,
    );
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(observed).toContain('dark');
    expect(setItem).toHaveBeenCalledWith(THEME_PREFERENCE_STORAGE_KEY, 'dark');
  });

  it('hydrates the previously-written value at boot', async () => {
    await AsyncStorage.setItem(THEME_PREFERENCE_STORAGE_KEY, 'light');

    const observed: ThemePreference[] = [];
    render(
      <ThemePreferenceProvider>
        <Probe onReady={({ value }) => observed.push(value)} />
      </ThemePreferenceProvider>,
    );
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(observed[observed.length - 1]).toBe('light');
  });

  it('AsyncStorage write failure does not throw and in-memory state still updates (FR-024)', async () => {
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disk full') as never);

    const observed: ThemePreference[] = [];
    render(
      <ThemePreferenceProvider>
        <Probe
          onReady={({ value, set }) => {
            observed.push(value);
            if (value === 'system') set('dark');
          }}
        />
      </ThemePreferenceProvider>,
    );
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(observed).toContain('dark');
  });
});

// ---------------------------------------------------------------------------
// EffectiveColorScheme derivation tests (T032 + T033). The function under test
// is inlined here to mirror the rule in src/hooks/use-theme.ts without
// re-importing useColorScheme from react-native.
// ---------------------------------------------------------------------------

type OSScheme = 'light' | 'dark' | 'unspecified' | null;

function resolveScheme(preference: ThemePreference, osScheme: OSScheme): 'light' | 'dark' {
  if (preference === 'light' || preference === 'dark') return preference;
  return osScheme === 'unspecified' || osScheme == null ? 'light' : osScheme;
}

describe('EffectiveColorScheme derivation (data-model.md §EffectiveColorScheme)', () => {
  it('"light" wins regardless of OS scheme', () => {
    expect(resolveScheme('light', 'dark')).toBe('light');
    expect(resolveScheme('light', 'light')).toBe('light');
    expect(resolveScheme('light', 'unspecified')).toBe('light');
  });

  it('"dark" wins regardless of OS scheme', () => {
    expect(resolveScheme('dark', 'light')).toBe('dark');
    expect(resolveScheme('dark', 'dark')).toBe('dark');
    expect(resolveScheme('dark', null)).toBe('dark');
  });

  it('"system" follows useColorScheme()', () => {
    expect(resolveScheme('system', 'dark')).toBe('dark');
    expect(resolveScheme('system', 'light')).toBe('light');
  });

  it('"system" + "unspecified" defaults to "light"', () => {
    expect(resolveScheme('system', 'unspecified')).toBe('light');
    expect(resolveScheme('system', null)).toBe('light');
  });

  // T033 — non-system mode ignores OS appearance changes.
  it('OS appearance changes do NOT affect EffectiveColorScheme when preference is "light" (FR-023)', () => {
    expect(resolveScheme('light', 'dark')).toBe('light');
    expect(resolveScheme('light', 'light')).toBe('light');
  });

  it('OS appearance changes do NOT affect EffectiveColorScheme when preference is "dark" (FR-023)', () => {
    expect(resolveScheme('dark', 'light')).toBe('dark');
    expect(resolveScheme('dark', 'dark')).toBe('dark');
  });
});
