import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Glass, type GlassShape } from '@/components/glass';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { TINTS, type TintId } from './tints';

const SHAPES: ReadonlyArray<{ id: GlassShape; label: string }> = [
  { id: 'rounded', label: 'Rounded' },
  { id: 'pill', label: 'Pill' },
  { id: 'circle', label: 'Circle' },
];

const INTENSITY_STEPS = [0.15, 0.35, 0.55, 0.75, 0.95] as const;

export function PlaygroundScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [intensity, setIntensity] = useState<number>(0.55);
  const [tintId, setTintId] = useState<TintId>('aqua');
  const [shape, setShape] = useState<GlassShape>('rounded');

  const tint = useMemo(() => TINTS.find((t) => t.id === tintId)?.value, [tintId]);

  return (
    <ThemedView style={styles.root}>
      <ScrollView
        style={[styles.scroll, { backgroundColor: theme.background }]}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.four,
            paddingBottom: insets.bottom + BottomTabInset + Spacing.four,
          },
        ]}
      >
        <ThemedView style={styles.header}>
          <ThemedText type="subtitle">Liquid Glass</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {Platform.OS === 'ios'
              ? 'Three live glass surfaces. Adjust the controls below.'
              : Platform.OS === 'android'
                ? 'Android fallback: translucent material surfaces.'
                : 'Web fallback: CSS backdrop-filter surfaces.'}
          </ThemedText>
        </ThemedView>

        {/* Three distinct glass surfaces — all driven by the same controls. */}
        <ThemedView style={styles.surfaces}>
          <Glass intensity={intensity} tint={tint} shape={shape} style={styles.surfaceLarge}>
            <ThemedText type="title" style={styles.surfaceTextCenter}>
              A
            </ThemedText>
          </Glass>

          <ThemedView style={styles.surfaceRow}>
            <Glass intensity={intensity} tint={tint} shape={shape} style={styles.surfaceMedium}>
              <ThemedText type="subtitle" style={styles.surfaceTextCenter}>
                B
              </ThemedText>
            </Glass>
            <Glass intensity={intensity} tint={tint} shape={shape} style={styles.surfaceSmall}>
              <ThemedText type="subtitle" style={styles.surfaceTextCenter}>
                C
              </ThemedText>
            </Glass>
          </ThemedView>
        </ThemedView>

        {/* Controls */}
        <ThemedView type="backgroundElement" style={styles.controlsCard}>
          <ThemedView type="backgroundElement" style={styles.controlGroup}>
            <ThemedText type="smallBold">Blur intensity</ThemedText>
            <ThemedView type="backgroundElement" style={styles.row}>
              {INTENSITY_STEPS.map((value) => {
                const selected = Math.abs(value - intensity) < 0.001;
                return (
                  <Pressable
                    key={value}
                    onPress={() => setIntensity(value)}
                    accessibilityRole="button"
                    accessibilityLabel={`Set intensity to ${value}`}
                  >
                    <ThemedView
                      type={selected ? 'backgroundSelected' : 'background'}
                      style={styles.chip}
                    >
                      <ThemedText type="small" themeColor={selected ? 'text' : 'textSecondary'}>
                        {Math.round(value * 100)}%
                      </ThemedText>
                    </ThemedView>
                  </Pressable>
                );
              })}
            </ThemedView>
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.controlGroup}>
            <ThemedText type="smallBold">Tint</ThemedText>
            <ThemedView type="backgroundElement" style={styles.row}>
              {TINTS.map((t) => {
                const selected = t.id === tintId;
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => setTintId(t.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Set tint to ${t.label}`}
                  >
                    <ThemedView
                      type={selected ? 'backgroundSelected' : 'background'}
                      style={styles.chip}
                    >
                      <ThemedText type="small" themeColor={selected ? 'text' : 'textSecondary'}>
                        {t.label}
                      </ThemedText>
                    </ThemedView>
                  </Pressable>
                );
              })}
            </ThemedView>
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.controlGroup}>
            <ThemedText type="smallBold">Shape</ThemedText>
            <ThemedView type="backgroundElement" style={styles.segmented}>
              {SHAPES.map((s) => {
                const selected = s.id === shape;
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => setShape(s.id)}
                    style={styles.segmentedButton}
                    accessibilityRole="button"
                    accessibilityLabel={`Set shape to ${s.label}`}
                  >
                    <ThemedView
                      type={selected ? 'backgroundSelected' : 'background'}
                      style={styles.segmentedInner}
                    >
                      <ThemedText type="small" themeColor={selected ? 'text' : 'textSecondary'}>
                        {s.label}
                      </ThemedText>
                    </ThemedView>
                  </Pressable>
                );
              })}
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    gap: Spacing.two,
  },
  surfaces: {
    gap: Spacing.three,
  },
  surfaceRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  surfaceLarge: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  surfaceMedium: {
    flex: 2,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  surfaceSmall: {
    flex: 1,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  surfaceTextCenter: {
    textAlign: 'center',
  },
  controlsCard: {
    gap: Spacing.four,
    padding: Spacing.four,
    borderRadius: Spacing.four,
  },
  controlGroup: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
  segmented: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  segmentedButton: {
    flex: 1,
  },
  segmentedInner: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
});
