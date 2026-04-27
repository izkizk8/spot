/**
 * StatusPanel — bridge availability + current config summary + next refresh.
 *
 * On iOS 14+ (isAvailable), displays:
 *  - Bridge availability line
 *  - Current config summary (showcaseValue / counter / tint)
 *  - "Next refresh time" line = (now + 30min) in user locale (plan §Resolved #3)
 *
 * Otherwise, renders an unavailable banner (FR-031).
 *
 * @see specs/014-home-widgets/tasks.md T033
 */

import React from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { WidgetConfig } from '@/modules/widgets-lab/widget-config';

const REFRESH_INTERVAL_MS = 30 * 60 * 1000;

export interface StatusPanelProps {
  readonly isAvailable: boolean;
  readonly config: WidgetConfig;
  readonly lastRefreshIso?: string;
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString();
}

export function StatusPanel({ isAvailable, config, lastRefreshIso }: StatusPanelProps) {
  if (!isAvailable) {
    return (
      <ThemedView style={styles.banner}>
        <ThemedText style={styles.bannerText}>
          Home Screen widgets require iOS 14+. Configuration and previews work on this platform.
        </ThemedText>
      </ThemedView>
    );
  }

  const next = new Date(Date.now() + REFRESH_INTERVAL_MS);

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.heading}>Status</ThemedText>
      <ThemedText style={styles.line}>Bridge available</ThemedText>
      <ThemedText style={styles.line}>
        {config.showcaseValue} · {config.counter} · {config.tint}
      </ThemedText>
      <ThemedText
        style={styles.line}
        accessibilityLabel="Next refresh time"
      >
        Next refresh ≈ {formatTime(next)}
      </ThemedText>
      {lastRefreshIso != null && (
        <ThemedText style={styles.line}>Last refresh: {lastRefreshIso}</ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: '#D0D1D6',
  },
  heading: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.one,
  },
  line: {
    fontSize: 13,
  },
  banner: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    backgroundColor: '#FFF3CD',
  },
  bannerText: {
    fontSize: 14,
    color: '#856404',
  },
});
