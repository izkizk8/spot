/**
 * SleepCard — HealthKit Lab (feature 043).
 *
 * Renders last night's sleep segments as a horizontally stacked bar
 * coloured by stage, plus a totals row underneath. If no segments are
 * loaded, an empty state is shown.
 */

import React, { useMemo } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import { type SleepSegment, type SleepStage, formatMinutes } from '../sample-types';

interface SleepCardProps {
  readonly segments: readonly SleepSegment[];
  readonly style?: ViewStyle;
}

const STAGE_COLOR: Readonly<Record<SleepStage, string>> = Object.freeze({
  inBed: '#A4B0C0',
  awake: '#FFD60A',
  asleep: '#0A84FF',
  core: '#5AC8FA',
  rem: '#BF5AF2',
  deep: '#0040DD',
});

const STAGE_LABEL: Readonly<Record<SleepStage, string>> = Object.freeze({
  inBed: 'In bed',
  awake: 'Awake',
  asleep: 'Asleep',
  core: 'Core',
  rem: 'REM',
  deep: 'Deep',
});

export default function SleepCard({ segments, style }: SleepCardProps) {
  const totals = useMemo(() => {
    const m = new Map<SleepStage, number>();
    let total = 0;
    for (const s of segments) {
      m.set(s.stage, (m.get(s.stage) ?? 0) + s.minutes);
      total += s.minutes;
    }
    return { byStage: m, total };
  }, [segments]);

  return (
    <ThemedView style={[styles.container, style]} testID="healthkit-sleep-card">
      <ThemedText style={styles.heading}>Last night&apos;s sleep</ThemedText>
      {segments.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary" testID="healthkit-sleep-empty">
          No sleep data yet. Authorize SleepAnalysis and refresh.
        </ThemedText>
      ) : (
        <>
          <View style={styles.stack} testID="healthkit-sleep-stack">
            {segments.map((s, i) => {
              const widthPct = totals.total > 0 ? (s.minutes / totals.total) * 100 : 0;
              return (
                <View
                  key={`${s.startDate}-${i}`}
                  testID={`healthkit-sleep-seg-${i}`}
                  style={[
                    styles.segBlock,
                    { width: `${widthPct}%`, backgroundColor: STAGE_COLOR[s.stage] },
                  ]}
                />
              );
            })}
          </View>
          <View style={styles.legend}>
            {Array.from(totals.byStage.entries()).map(([stage, mins]) => (
              <View key={stage} style={styles.legendRow} testID={`healthkit-sleep-legend-${stage}`}>
                <View style={[styles.swatch, { backgroundColor: STAGE_COLOR[stage] }]} />
                <ThemedText type="smallBold">{STAGE_LABEL[stage]}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.legendValue}>
                  {formatMinutes(mins)}
                </ThemedText>
              </View>
            ))}
          </View>
          <ThemedText type="smallBold" testID="healthkit-sleep-total">
            Total: {formatMinutes(totals.total)}
          </ThemedText>
        </>
      )}
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
  stack: {
    flexDirection: 'row',
    height: 14,
    borderRadius: Spacing.half,
    overflow: 'hidden',
    marginTop: Spacing.one,
  },
  segBlock: {
    height: '100%',
  },
  legend: {
    gap: Spacing.half,
    marginTop: Spacing.one,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  swatch: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendValue: {
    marginLeft: 'auto',
    fontVariant: ['tabular-nums'],
  },
});
