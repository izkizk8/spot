/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { usePreference } from '@/theme/use-theme-preference';

export type EffectiveColorScheme = 'light' | 'dark';

/**
 * Resolve the effective color scheme honoring the user's preference:
 *   - 'light' / 'dark' win regardless of OS setting (FR-023)
 *   - 'system' follows useColorScheme(), defaulting to 'light' on 'unspecified'
 */
function resolveScheme(
  preference: 'system' | 'light' | 'dark',
  osScheme: ReturnType<typeof useColorScheme>,
): EffectiveColorScheme {
  if (preference === 'light' || preference === 'dark') return preference;
  return osScheme === 'unspecified' || osScheme == null ? 'light' : osScheme;
}

export function useTheme() {
  const preference = usePreference();
  const osScheme = useColorScheme();
  const theme = resolveScheme(preference, osScheme);

  return Colors[theme];
}
