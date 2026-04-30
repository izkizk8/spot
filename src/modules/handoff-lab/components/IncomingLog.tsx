/**
 * IncomingLog — feature 040 / T033 / US4.
 *
 * Renders a list of ContinuationEvent rows; empty-state copy when none.
 * Truncation invariant lives in the hook (FR-014); this component
 * renders one row per input event.
 */

import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { ContinuationEvent } from '../types';

interface IncomingLogProps {
  readonly events: readonly ContinuationEvent[];
  readonly style?: ViewStyle;
}

interface RowProps {
  readonly event: ContinuationEvent;
  readonly index: number;
}

function Row({ event, index }: RowProps) {
  return (
    <View style={styles.row} testID={`incoming-row-${index}`}>
      <ThemedText type="smallBold">{event.activityType}</ThemedText>
      <ThemedText type="small">{event.title}</ThemedText>
      {event.webpageURL !== undefined ? (
        <ThemedText type="small" themeColor="textSecondary">
          {event.webpageURL}
        </ThemedText>
      ) : null}
      <ThemedText type="small" style={styles.code}>
        {JSON.stringify(event.userInfo, null, 2)}
      </ThemedText>
      {event.requiredUserInfoKeys.length > 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          required: {event.requiredUserInfoKeys.join(', ')}
        </ThemedText>
      ) : null}
      <ThemedText type="small" themeColor="textSecondary">
        {event.receivedAt}
      </ThemedText>
    </View>
  );
}

export default function IncomingLog({ events, style }: IncomingLogProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.heading}>Incoming Activity Log</ThemedText>
      {events.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          Waiting for incoming activities…
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
  heading: {
    fontSize: 18,
    fontWeight: '600',
  },
  row: {
    paddingVertical: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.one,
  },
  code: {
    fontFamily: 'Courier',
  },
});
