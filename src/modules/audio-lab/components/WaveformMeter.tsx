/**
 * WaveformMeter — fixed-length ring buffer of recent metering levels rendered
 * as horizontal bars (US1, T034).
 *
 * The newest sample is the rightmost bar; older samples shift left and are
 * dropped off the left edge. `level` is expected to be in [0, 1] (0 = silence,
 * 1 = clipping).
 *
 * Each bar uses a Reanimated `useAnimatedStyle` so the height interpolates
 * smoothly when a new level arrives. The Jest setup mocks Reanimated to a
 * plain `View` — the visual fade is iOS/Android-runtime only.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface WaveformMeterProps {
  /** Latest metering level in [0, 1]. */
  level: number;
  /** Number of bars / ring-buffer slots. Default 32. */
  history?: number;
  /** Total height of the meter in points. Default 48. */
  height?: number;
}

const DEFAULT_HISTORY = 32;
const DEFAULT_HEIGHT = 48;

interface BarProps {
  level: number;
  position: number; // 0 = oldest, history-1 = newest
  total: number;
  color: string;
  containerHeight: number;
}

function Bar({ level, position, total, color, containerHeight }: BarProps) {
  const heightSv = useSharedValue(level);

  React.useEffect(() => {
    heightSv.value = withTiming(level, { duration: 100 });
  }, [heightSv, level]);

  // Newer bars are more prominent. Compute opacity 0.25 .. 1.0 across history.
  const opacity = 0.25 + 0.75 * (position / Math.max(1, total - 1));

  const animatedStyle = useAnimatedStyle(() => {
    const h = Math.max(2, Math.min(containerHeight, heightSv.value * containerHeight));
    return { height: h };
  });

  return (
    <Animated.View
      testID='audio-lab-waveform-bar'
      style={[styles.bar, { backgroundColor: color, opacity }, animatedStyle]}
    />
  );
}

export default function WaveformMeter({
  level,
  history = DEFAULT_HISTORY,
  height = DEFAULT_HEIGHT,
}: WaveformMeterProps) {
  const theme = useTheme();
  const [buffer, setBuffer] = React.useState<number[]>(() =>
    Array.from({ length: history }, () => 0),
  );

  // Push new level into ring buffer when prop changes; also handle history
  // resize in the same pass to avoid a cascading setState-in-effect.
  const lastLevelRef = React.useRef<number | null>(null);
  React.useEffect(() => {
    if (lastLevelRef.current === level && buffer.length === history) return;
    lastLevelRef.current = level;
    setBuffer((prev) => {
      let next = prev;
      if (next.length !== history) {
        next =
          next.length > history
            ? next.slice(-history)
            : [...Array.from({ length: history - next.length }, () => 0), ...next];
      }
      next = next.slice(-history + 1);
      next.push(Math.max(0, Math.min(1, level)));
      while (next.length < history) next.unshift(0);
      return next;
    });
  }, [buffer.length, history, level]);

  return (
    <View style={[styles.row, { height }]} testID='audio-lab-waveform-meter'>
      {buffer.map((lvl, idx) => (
        <Bar
          key={idx}
          level={lvl}
          position={idx}
          total={buffer.length}
          color={theme.tintA}
          containerHeight={height}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  bar: {
    flex: 1,
    minWidth: 2,
    borderRadius: Spacing.half,
  },
});
