/**
 * @file screen.tsx
 * @description Sensors Playground screen — header (Start All / Stop All) +
 * four cards stacked in canonical order.
 */
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import { AccelerometerCard } from './cards/AccelerometerCard';
import { DeviceMotionCard } from './cards/DeviceMotionCard';
import { GyroscopeCard } from './cards/GyroscopeCard';
import { MagnetometerCard } from './cards/MagnetometerCard';
import {
  SensorsRegistryProvider,
  type SensorCardHandle,
  type SensorsRegistry,
} from './SensorsContext';

export default function SensorsPlaygroundScreen() {
  const handlesRef = useRef<Set<SensorCardHandle>>(new Set());
  const [anyRunning, setAnyRunning] = useState(false);

  const registry = useMemo<SensorsRegistry>(
    () => ({
      register: (handle) => {
        handlesRef.current.add(handle);
        return () => {
          handlesRef.current.delete(handle);
        };
      },
      list: () => Array.from(handlesRef.current),
    }),
    [],
  );

  const onStartAll = useCallback(() => {
    handlesRef.current.forEach((h) => {
      if (h.isAvailable()) h.start();
    });
    setAnyRunning(true);
  }, []);

  const onStopAll = useCallback(() => {
    handlesRef.current.forEach((h) => h.stop());
    setAnyRunning(false);
  }, []);

  return (
    <SensorsRegistryProvider value={registry}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        testID="sensors-playground-screen"
      >
        <ThemedView style={styles.header}>
          <ThemedText type="title" testID="sensors-playground-title">
            Sensors Playground
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            testID="start-all-button"
            onPress={anyRunning ? onStopAll : onStartAll}
            style={styles.headerButton}
          >
            <ThemedText type="smallBold">{anyRunning ? 'Stop All' : 'Start All'}</ThemedText>
          </Pressable>
        </ThemedView>

        <AccelerometerCard />
        <GyroscopeCard />
        <MagnetometerCard />
        <DeviceMotionCard />
      </ScrollView>
    </SensorsRegistryProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.three, gap: Spacing.three },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  headerButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.one,
    backgroundColor: '#E0E1E6',
  },
});
