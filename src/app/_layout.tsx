import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import React from 'react';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { StartupErrorOverlay } from '@/components/error-overlay';
import { useQuickActions } from '@/modules/quick-actions-lab/hooks/useQuickActions';
import { ThemePreferenceProvider } from '@/theme/preference-provider';
import { useTheme } from '@/hooks/use-theme';
import { Colors } from '@/constants/theme';

function ThemedShell() {
  const theme = useTheme();
  useQuickActions();
  const isDark = theme.background === Colors.dark.background;
  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AppTabs />
    </ThemeProvider>
  );
}

export default function TabLayout() {
  return (
    <StartupErrorOverlay>
      <ThemePreferenceProvider>
        <ThemedShell />
      </ThemePreferenceProvider>
    </StartupErrorOverlay>
  );
}
