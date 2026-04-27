import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useEffect, useState, type ReactNode } from 'react';

export type ThemePreference = 'system' | 'light' | 'dark';

export const THEME_PREFERENCE_STORAGE_KEY = 'spot.theme.preference';
const DEFAULT_PREFERENCE: ThemePreference = 'system';

export interface ThemePreferenceContextValue {
  preference: ThemePreference;
  setPreference: (next: ThemePreference) => void;
  /** True after the persisted value (if any) has been hydrated from storage. */
  loaded: boolean;
}

export const ThemePreferenceContext = createContext<ThemePreferenceContextValue>({
  preference: DEFAULT_PREFERENCE,
  setPreference: () => {},
  loaded: false,
});

function isValidPreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

export interface ThemePreferenceProviderProps {
  children: ReactNode;
}

export function ThemePreferenceProvider({ children }: ThemePreferenceProviderProps) {
  const [preference, setPreferenceState] = useState<ThemePreference>(DEFAULT_PREFERENCE);
  const [loaded, setLoaded] = useState(false);

  // Read once at boot.
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(THEME_PREFERENCE_STORAGE_KEY)
      .then((value) => {
        if (cancelled) return;
        if (isValidPreference(value)) {
          setPreferenceState(value);
        }
      })
      .catch((err: unknown) => {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.warn('[theme] failed to read preference from AsyncStorage', err);
        }
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    // FR-024: write failures are logged in dev only; in-memory state still updates.
    AsyncStorage.setItem(THEME_PREFERENCE_STORAGE_KEY, next).catch((err: unknown) => {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn('[theme] failed to persist preference to AsyncStorage', err);
      }
    });
  }, []);

  return (
    <ThemePreferenceContext.Provider value={{ preference, setPreference, loaded }}>
      {children}
    </ThemePreferenceContext.Provider>
  );
}
