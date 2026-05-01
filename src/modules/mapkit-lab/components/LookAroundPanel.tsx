import React, { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Region } from '@/modules/mapkit-lab/landmarks';

import { IOSOnlyBanner } from './IOSOnlyBanner';

export interface LookAroundBridge {
  presentLookAround: (lat: number, lng: number) => Promise<{ shown: boolean }>;
}

interface LookAroundPanelProps {
  region: Region;
  bridge: LookAroundBridge;
  iosVersionAtLeast16: boolean;
}

export function LookAroundPanel({ region, bridge, iosVersionAtLeast16 }: LookAroundPanelProps) {
  const theme = useTheme();
  const [error, setError] = useState<string | null>(null);
  const [noImagery, setNoImagery] = useState(false);

  if (!iosVersionAtLeast16) {
    return <IOSOnlyBanner reason='ios-version' />;
  }

  const handlePress = async () => {
    setError(null);
    setNoImagery(false);
    try {
      const result = await bridge.presentLookAround(region.lat, region.lng);
      if (!result.shown) setNoImagery(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Look Around failed';
      setError(message);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Pressable
        accessibilityRole='button'
        onPress={handlePress}
        testID='lookaround-show-button'
        style={[styles.button, { backgroundColor: theme.tintA }]}
      >
        <ThemedText type='smallBold' style={{ color: '#ffffff' }}>
          Show LookAround at center
        </ThemedText>
      </Pressable>

      {noImagery ? (
        <ThemedText type='small' themeColor='textSecondary' testID='lookaround-no-imagery'>
          No Look Around imagery here
        </ThemedText>
      ) : null}

      {error ? (
        <ThemedText type='small' themeColor='textSecondary' testID='lookaround-error'>
          {error}
        </ThemedText>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  button: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
