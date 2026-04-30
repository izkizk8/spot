/**
 * PayloadViewer — App Clips Lab (feature 042).
 *
 * Renders the most-recent simulated invocation as a labelled payload
 * card and, beneath it, a list of prior invocations with the same data
 * (most-recent first). Empty state copy when no invocations have been
 * simulated yet.
 */

import React from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { findInvocationSource } from '../invocation-sources';
import type { SimulatedInvocation } from '../simulator-store';

interface PayloadViewerProps {
  readonly invocations: readonly SimulatedInvocation[];
  readonly onClear?: () => void;
  readonly style?: ViewStyle;
}

interface RowProps {
  readonly invocation: SimulatedInvocation;
  readonly index: number;
}

function MetadataRows({ metadata }: { readonly metadata: Readonly<Record<string, string>> }) {
  const entries = Object.entries(metadata);
  if (entries.length === 0) return null;
  return (
    <View>
      {entries.map(([k, v]) => (
        <ThemedText key={k} type="small" themeColor="textSecondary">
          {k}: {v}
        </ThemedText>
      ))}
    </View>
  );
}

function Row({ invocation, index }: RowProps) {
  const source = findInvocationSource(invocation.source);
  return (
    <View style={styles.row} testID={`payload-row-${index}`}>
      <ThemedText type="smallBold">{invocation.url}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        source: {source?.label ?? invocation.source}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {invocation.receivedAt}
      </ThemedText>
      <MetadataRows metadata={invocation.metadata} />
    </View>
  );
}

export default function PayloadViewer({ invocations, onClear, style }: PayloadViewerProps) {
  const theme = useTheme();
  const [latest, ...rest] = invocations;

  return (
    <ThemedView style={[styles.container, style]}>
      <View style={styles.headingRow}>
        <ThemedText style={styles.heading}>Payload Viewer</ThemedText>
        {onClear !== undefined && invocations.length > 0 ? (
          <Pressable
            testID="clear-payloads-btn"
            onPress={onClear}
            style={[styles.clearBtn, { backgroundColor: theme.backgroundElement }]}
          >
            <ThemedText type="small" themeColor="textSecondary">
              Clear
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
      {invocations.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary" testID="payload-empty">
          No simulated invocations yet. Press Simulate launch above.
        </ThemedText>
      ) : (
        <>
          <View testID="payload-latest" style={styles.latestBox}>
            <ThemedText type="smallBold">Latest payload</ThemedText>
            <Row invocation={latest} index={0} />
          </View>
          {rest.length > 0 ? (
            <View>
              <ThemedText type="smallBold" style={styles.historyHeading}>
                History
              </ThemedText>
              {rest.map((inv, idx) => (
                <Row key={inv.id} invocation={inv} index={idx + 1} />
              ))}
            </View>
          ) : null}
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
  headingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
  },
  latestBox: {
    paddingVertical: Spacing.one,
    gap: Spacing.one,
  },
  historyHeading: {
    marginTop: Spacing.two,
  },
  row: {
    paddingVertical: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.half,
  },
  clearBtn: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.one,
  },
});
