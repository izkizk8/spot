import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import { HapticButton } from './components/HapticButton';
import { PatternSequencer } from './components/PatternSequencer';
import { PresetList } from './components/PresetList';
import { play } from './haptic-driver';
import { deletePreset, list, save } from './presets-store';
import type {
  Cell,
  ImpactIntensity,
  NotificationIntensity,
  Pattern,
  Preset,
} from './types';

const STEP_MS = 120;

const NOTIFICATION_BUTTONS: ReadonlyArray<{ intensity: NotificationIntensity; label: string }> = [
  { intensity: 'success', label: 'Success' },
  { intensity: 'warning', label: 'Warning' },
  { intensity: 'error', label: 'Error' },
];

const IMPACT_BUTTONS: ReadonlyArray<{ intensity: ImpactIntensity; label: string }> = [
  { intensity: 'light', label: 'Light' },
  { intensity: 'medium', label: 'Medium' },
  { intensity: 'heavy', label: 'Heavy' },
];

const SELECTION_BUTTONS: ReadonlyArray<{ label: string }> = [
  { label: 'Tick A' },
  { label: 'Tick B' },
  { label: 'Tick C' },
];

const fireCell = (cell: Cell): void => {
  if (cell.kind === 'off') return;
  if (cell.kind === 'impact') void play('impact', cell.intensity);
  if (cell.kind === 'notification') void play('notification', cell.intensity);
};

export function HapticsPlaygroundScreen() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  }, []);

  useEffect(() => {
    let cancelled = false;
    void list().then((p) => {
      if (!cancelled) setPresets(p);
    });
    return () => {
      cancelled = true;
      clearTimers();
    };
  }, [clearTimers]);

  const playPattern = useCallback(
    (pattern: Pattern) => {
      clearTimers();
      pattern.forEach((cell, idx) => {
        const t = setTimeout(() => fireCell(cell), idx * STEP_MS);
        timersRef.current.push(t);
      });
    },
    [clearTimers],
  );

  const handleSave = useCallback(async (pattern: Pattern) => {
    try {
      const created = await save(pattern);
      setPresets((prev) => [...prev, created]);
      setError(null);
    } catch (err) {
      setError((err as Error).message ?? 'Failed to save preset');
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    await deletePreset(id);
    setPresets((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Haptics Playground</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Tap any button to feel a single haptic, or compose a pattern below.
        </ThemedText>
      </ThemedView>

      {Platform.OS === 'web' ? (
        <ThemedView style={styles.banner}>
          <ThemedText type="small">Haptics not supported on this platform</ThemedText>
        </ThemedView>
      ) : null}

      <ThemedView style={styles.section}>
        <ThemedText type="smallBold">Notification</ThemedText>
        <View style={styles.buttonRow}>
          {NOTIFICATION_BUTTONS.map((b) => (
            <View key={b.intensity} testID={`haptic-btn-notification-${b.intensity}`}>
              <HapticButton kind="notification" intensity={b.intensity} label={b.label} />
            </View>
          ))}
        </View>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="smallBold">Impact</ThemedText>
        <View style={styles.buttonRow}>
          {IMPACT_BUTTONS.map((b) => (
            <View key={b.intensity} testID={`haptic-btn-impact-${b.intensity}`}>
              <HapticButton kind="impact" intensity={b.intensity} label={b.label} />
            </View>
          ))}
        </View>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="smallBold">Selection</ThemedText>
        <View style={styles.buttonRow}>
          {SELECTION_BUTTONS.map((b, i) => (
            <View key={b.label} testID={`haptic-btn-selection-${i}`}>
              <HapticButton kind="selection" label={b.label} />
            </View>
          ))}
        </View>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="smallBold">Composer</ThemedText>
        <PatternSequencer onSave={handleSave} />
      </ThemedView>

      {error ? (
        <ThemedView style={styles.error}>
          <ThemedText type="small">{error}</ThemedText>
        </ThemedView>
      ) : null}

      <ThemedView style={styles.section}>
        <ThemedText type="smallBold">Presets</ThemedText>
        <PresetList
          presets={presets}
          onPlay={(p) => playPattern(p.pattern)}
          onDelete={handleDelete}
        />
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  section: {
    gap: Spacing.two,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  banner: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(127,127,127,0.4)',
  },
  error: {
    padding: Spacing.two,
    borderRadius: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(220,80,80,0.6)',
  },
});
