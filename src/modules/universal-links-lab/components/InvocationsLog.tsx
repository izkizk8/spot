/**
 * InvocationsLog — Universal Links Lab (feature 041).
 *
 * Renders a list of incoming Universal Link events; empty-state copy
 * when none. Truncation invariant lives in the hook (FIFO at 10).
 */

import React from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { UniversalLinkEvent } from '../types';

interface InvocationsLogProps {
  readonly events: readonly UniversalLinkEvent[];
  readonly onClear?: () => void;
  readonly style?: ViewStyle;
}

interface RowProps {
  readonly event: UniversalLinkEvent;
  readonly index: number;
}

function Row({ event, index }: RowProps) {
  return (
    <View style={styles.row} testID={`invocation-row-${index}`}>
      <ThemedText type="smallBold">{event.url}</ThemedText>
      {event.host.length > 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          host: {event.host}
        </ThemedText>
      ) : null}
      <ThemedText type="small" themeColor="textSecondary">
        path: {event.path}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {event.receivedAt}
      </ThemedText>
    </View>
  );
}

export default function InvocationsLog({ events, onClear, style }: InvocationsLogProps) {
  const theme = useTheme();
  return (
    <ThemedView style={[styles.container, style]}>
      <View style={styles.headingRow}>
        <ThemedText style={styles.heading}>Recent Invocations (last 10)</ThemedText>
        {onClear !== undefined && events.length > 0 ? (
          <Pressable
            testID="clear-invocations-btn"
            onPress={onClear}
            style={[styles.clearBtn, { backgroundColor: theme.backgroundElement }]}
          >
            <ThemedText type="small" themeColor="textSecondary">
              Clear
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
      {events.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          Waiting for incoming Universal Links…
        </ThemedText>
      ) : (
        events.map((event, index) => <Row key={index} event={event} index={index} />)
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
  headingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
  },
  row: {
    paddingVertical: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.one,
  },
  clearBtn: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.one,
  },
});
