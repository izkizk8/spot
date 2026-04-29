/**
 * AnchorSelector — feature 033 / T030.
 *
 * iPad-only: renders 4 buttons, tracks layout rects, propagates AnchorRect
 * on selection. Returns null when Platform.isPad is false.
 */

import React, { useRef } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  type LayoutChangeEvent,
  type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { AnchorRect } from '@/native/share-sheet.types';

interface AnchorSelectorProps {
  readonly onAnchorChange: (anchor: AnchorRect | null) => void;
  readonly style?: ViewStyle;
}

type AnchorPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

const POSITIONS: readonly AnchorPosition[] = [
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
];

export default function AnchorSelector({ onAnchorChange, style }: AnchorSelectorProps) {
  const rectsRef = useRef<Map<AnchorPosition, AnchorRect>>(new Map());

  // Only render on iOS (iPad specifically, but safe to show on iPhone where it's ignored)
  if (Platform.OS !== 'ios') {
    return null;
  }

  const handleLayout = (position: AnchorPosition, event: LayoutChangeEvent) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    rectsRef.current.set(position, { x, y, width, height });
  };

  const handlePress = (position: AnchorPosition) => {
    const rect = rectsRef.current.get(position);
    if (rect) {
      onAnchorChange(rect);
    }
  };

  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.title}>iPad Anchor (tap to set popover source):</ThemedText>
      <ThemedView style={styles.grid}>
        {POSITIONS.map((pos) => (
          <Pressable
            key={pos}
            accessibilityRole="button"
            accessibilityLabel={`Anchor ${pos}`}
            onLayout={(e) => handleLayout(pos, e)}
            onPress={() => handlePress(pos)}
            style={styles.button}
          >
            <ThemedText style={styles.buttonText}>{pos}</ThemedText>
          </Pressable>
        ))}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.7,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  button: {
    flex: 1,
    minWidth: 100,
    padding: Spacing.three,
    borderRadius: Spacing.two,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
