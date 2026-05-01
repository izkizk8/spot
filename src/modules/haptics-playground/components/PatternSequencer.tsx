import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import { play } from '../haptic-driver';
import type { Cell, ImpactIntensity, NotificationIntensity, Pattern } from '../types';

const OFF_CELL: Cell = { kind: 'off' };

const EMPTY_PATTERN: Pattern = [
  OFF_CELL,
  OFF_CELL,
  OFF_CELL,
  OFF_CELL,
  OFF_CELL,
  OFF_CELL,
  OFF_CELL,
  OFF_CELL,
];

const STEP_MS = 120;

const CYCLE: readonly Cell[] = [
  { kind: 'off' },
  { kind: 'impact', intensity: 'light' },
  { kind: 'impact', intensity: 'medium' },
  { kind: 'impact', intensity: 'heavy' },
  { kind: 'impact', intensity: 'soft' },
  { kind: 'impact', intensity: 'rigid' },
  { kind: 'notification', intensity: 'success' },
  { kind: 'notification', intensity: 'warning' },
  { kind: 'notification', intensity: 'error' },
];

const cellLabel = (c: Cell): string => (c.kind === 'off' ? 'off' : `${c.kind}:${c.intensity}`);

const nextCell = (c: Cell): Cell => {
  const idx = CYCLE.findIndex((x) => cellLabel(x) === cellLabel(c));
  return CYCLE[(idx + 1) % CYCLE.length] ?? OFF_CELL;
};

export interface PatternSequencerProps {
  readonly onSave?: (pattern: Pattern) => void;
  readonly onCellFire?: (index: number, cell: Cell) => void;
}

const fireCell = (cell: Cell): void => {
  if (cell.kind === 'off') return;
  if (cell.kind === ('selection' as never)) return;
  if (cell.kind === 'impact') {
    void play('impact', cell.intensity as ImpactIntensity);
    return;
  }
  if (cell.kind === 'notification') {
    void play('notification', cell.intensity as NotificationIntensity);
  }
};

export function PatternSequencer({ onSave, onCellFire }: PatternSequencerProps) {
  const [pattern, setPattern] = useState<Pattern>(EMPTY_PATTERN);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const cycleCell = useCallback((idx: number) => {
    setPattern((prev) => {
      const next = prev.slice() as Cell[];
      next[idx] = nextCell(prev[idx]);
      return next as unknown as Pattern;
    });
  }, []);

  const handlePlay = useCallback(() => {
    clearTimers();
    pattern.forEach((cell, idx) => {
      const t = setTimeout(() => {
        fireCell(cell);
        onCellFire?.(idx, cell);
      }, idx * STEP_MS);
      timersRef.current.push(t);
    });
  }, [pattern, clearTimers, onCellFire]);

  const handleSave = useCallback(() => {
    clearTimers();
    onSave?.(pattern);
  }, [pattern, onSave, clearTimers]);

  return (
    <ThemedView style={styles.root}>
      <View style={styles.row}>
        {pattern.map((cell, idx) => (
          <Pressable
            key={idx}
            testID={`cell-${idx}`}
            accessibilityLabel={`cell ${idx} ${cellLabel(cell)}`}
            accessibilityRole='button'
            onPress={() => cycleCell(idx)}
            style={styles.cell}
          >
            <ThemedText type='small'>{cellGlyph(cell)}</ThemedText>
          </Pressable>
        ))}
      </View>
      <View style={styles.controls}>
        <Pressable onPress={handlePlay} style={styles.button} accessibilityRole='button'>
          <ThemedText type='smallBold'>Play</ThemedText>
        </Pressable>
        <Pressable onPress={handleSave} style={styles.button} accessibilityRole='button'>
          <ThemedText type='smallBold'>Save Preset</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const cellGlyph = (c: Cell): string => {
  if (c.kind === 'off') return '·';
  if (c.kind === 'impact') return c.intensity[0]!.toUpperCase();
  return c.intensity[0]!.toUpperCase();
};

const styles = StyleSheet.create({
  root: {
    paddingVertical: Spacing.three,
    gap: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  cell: {
    width: 36,
    height: 36,
    borderRadius: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(127,127,127,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controls: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  button: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(127,127,127,0.5)',
  },
});
