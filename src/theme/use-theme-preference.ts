import { useContext } from 'react';

import { ThemePreferenceContext, type ThemePreference } from './preference-provider';

/** Read the current theme preference (`system` | `light` | `dark`). */
export function usePreference(): ThemePreference {
  return useContext(ThemePreferenceContext).preference;
}

/** Setter for the theme preference. Persists to AsyncStorage. */
export function useSetPreference(): (next: ThemePreference) => void {
  return useContext(ThemePreferenceContext).setPreference;
}

/** True after the persisted preference (if any) has been read at boot. */
export function usePreferenceLoaded(): boolean {
  return useContext(ThemePreferenceContext).loaded;
}

/** Convenience: pull both reader + writer in one call. */
export function useThemePreference() {
  const ctx = useContext(ThemePreferenceContext);
  return {
    preference: ctx.preference,
    setPreference: ctx.setPreference,
    loaded: ctx.loaded,
  };
}
