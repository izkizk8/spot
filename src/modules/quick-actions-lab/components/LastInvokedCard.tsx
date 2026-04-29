/**
 * LastInvokedCard — shows the most recent quick-action invocation
 * received by the hook this session. Empty state is the default.
 * Feature: 039-quick-actions
 */

import React from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { InvocationEvent } from '../types';

interface Props {
  event: InvocationEvent | null;
}

export function LastInvokedCard({ event }: Props) {
  return (
    <ThemedView style={styles.container} type="backgroundElement" testID="last-invoked-card">
      <ThemedText type="subtitle">Last invoked</ThemedText>
      {event ? (
        <>
          <ThemedText type="default" testID="last-invoked-type">
            {event.type}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" testID="last-invoked-timestamp">
            {event.timestamp}
          </ThemedText>
          <ThemedText type="code" testID="last-invoked-userinfo">
            {JSON.stringify(event.userInfo, null, 2)}
          </ThemedText>
        </>
      ) : (
        <ThemedText type="small" themeColor="textSecondary">
          No quick action invoked this session
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.two,
    borderRadius: Spacing.two,
  },
});
