/**
 * InvocationSimulator — App Clips Lab (feature 042).
 *
 * Lets the user select a simulated source surface (NFC / QR / Maps /
 * Safari / Messages / Default) and press "Simulate launch" to push a
 * synthetic `_XCAppClipURL` payload into the simulator-store. Pure JS;
 * no native bridge.
 */

import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import {
  INVOCATION_SOURCES,
  type InvocationSource,
  type InvocationSourceId,
} from '../invocation-sources';

interface InvocationSimulatorProps {
  readonly onSimulate: (input: {
    url: string;
    source: InvocationSourceId;
    metadata: Record<string, string>;
  }) => void;
  readonly style?: ViewStyle;
}

const DEFAULT_URL = 'https://spot.example.com/clip/coffee?id=42';

export default function InvocationSimulator({ onSimulate, style }: InvocationSimulatorProps) {
  const theme = useTheme();
  const [source, setSource] = useState<InvocationSourceId>('default');

  const handleSimulate = useCallback(() => {
    onSimulate({
      url: DEFAULT_URL,
      source,
      metadata: {
        surface: source,
        simulated: 'true',
      },
    });
  }, [onSimulate, source]);

  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.heading}>Invocation Simulator</ThemedText>
      <ThemedText type='small' themeColor='textSecondary'>
        Pick a simulated source surface, then press Simulate launch. A synthetic _XCAppClipURL
        payload will be pushed into the Payload Viewer below.
      </ThemedText>
      <View style={styles.row} testID='invocation-source-row'>
        {INVOCATION_SOURCES.map((s: InvocationSource) => {
          const selected = s.id === source;
          return (
            <Pressable
              key={s.id}
              testID={`source-toggle-${s.id}`}
              accessibilityState={{ selected }}
              onPress={() => {
                setSource(s.id);
              }}
              style={[
                styles.chip,
                {
                  backgroundColor: selected ? theme.tintA : theme.backgroundElement,
                },
              ]}
            >
              <ThemedText type='smallBold' themeColor={selected ? 'background' : 'textSecondary'}>
                {s.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
      <Pressable
        testID='simulate-launch-btn'
        onPress={handleSimulate}
        style={[styles.cta, { backgroundColor: theme.tintA }]}
      >
        <ThemedText type='smallBold' themeColor='background'>
          Simulate launch
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.two,
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
    marginTop: Spacing.one,
  },
  chip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.one,
  },
  cta: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.one,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
});
