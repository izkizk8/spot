/**
 * RecorderCard — big record button + elapsed-time readout + waveform meter +
 * quality selector (US1, T036).
 *
 * Pure UI surface — all state and side-effects live in `useAudioRecorder`.
 * The pulsing animation is a Reanimated `useAnimatedStyle` driven by the
 * `recording` status (the Jest mock degrades to a plain View).
 */

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

// `withRepeat` is missing in the Jest reanimated mock — fall back to a no-op.
const safeWithRepeat: (v: number, count: number, reverse?: boolean) => number =
  typeof withRepeat === 'function' ? (withRepeat as never) : (v: number) => v;

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { QualityName, RecorderState } from '../audio-types';

import WaveformMeter from './WaveformMeter';

export interface RecorderCardProps {
  status: RecorderState;
  elapsedMs: number;
  meterLevel: number;
  quality: QualityName;
  onStart: () => void;
  onStop: () => void;
  onChangeQuality: (q: QualityName) => void;
}

const QUALITIES: ReadonlyArray<QualityName> = ['Low', 'Medium', 'High'];

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

export default function RecorderCard({
  status,
  elapsedMs,
  meterLevel,
  quality,
  onStart,
  onStop,
  onChangeQuality,
}: RecorderCardProps) {
  const theme = useTheme();
  const isRecording = status === 'recording';
  const isBusy = status === 'requesting-permission' || status === 'stopping';
  const qualityDisabled = isRecording || isBusy;

  // Pulse animation while recording.
  const pulse = useSharedValue(1);
  React.useEffect(() => {
    if (isRecording) {
      pulse.value = safeWithRepeat(withTiming(1.15, { duration: 600 }), -1, true);
    } else {
      pulse.value = withTiming(1, { duration: 200 });
    }
  }, [isRecording, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const handlePress = () => {
    if (isBusy) return;
    if (isRecording) onStop();
    else onStart();
  };

  const buttonLabel = isRecording ? 'Stop' : 'Record';
  const buttonA11y = isRecording ? 'Stop recording' : 'Start recording';

  return (
    <ThemedView type='backgroundElement' style={styles.card}>
      <ThemedText
        type='title'
        accessibilityRole='text'
        accessibilityLabel={`Elapsed time ${formatElapsed(elapsedMs)}`}
        style={styles.elapsed}
        testID='audio-lab-elapsed'
      >
        {formatElapsed(elapsedMs)}
      </ThemedText>

      <WaveformMeter level={meterLevel} />

      <View style={styles.buttonRow}>
        <Animated.View style={pulseStyle}>
          <Pressable
            onPress={handlePress}
            disabled={isBusy}
            accessibilityRole='button'
            accessibilityLabel={buttonA11y}
            accessibilityState={{ disabled: isBusy, busy: isBusy }}
            style={[
              styles.recordButton,
              {
                backgroundColor: isRecording ? theme.tintB : theme.tintA,
              },
              isBusy && styles.disabled,
            ]}
            testID='audio-lab-record-button'
          >
            <ThemedText type='smallBold' themeColor='background'>
              {buttonLabel}
            </ThemedText>
          </Pressable>
        </Animated.View>
      </View>

      <View style={styles.qualityRow} accessibilityLabel='Quality preset'>
        {QUALITIES.map((q) => {
          const selected = q === quality;
          return (
            <Pressable
              key={q}
              onPress={() => {
                if (qualityDisabled) return;
                onChangeQuality(q);
              }}
              disabled={qualityDisabled}
              accessibilityRole='button'
              accessibilityLabel={`Quality: ${q}`}
              accessibilityState={{ selected, disabled: qualityDisabled }}
              style={[
                styles.qualitySegment,
                selected && { backgroundColor: theme.backgroundSelected },
                qualityDisabled && styles.disabled,
              ]}
            >
              <ThemedText type='smallBold' themeColor={selected ? 'tintA' : 'text'}>
                {q}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.one,
    gap: Spacing.three,
    alignItems: 'stretch',
  },
  elapsed: {
    fontSize: 36,
    lineHeight: 40,
    textAlign: 'center',
  },
  buttonRow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qualityRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  qualitySegment: {
    flex: 1,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.one,
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
});
