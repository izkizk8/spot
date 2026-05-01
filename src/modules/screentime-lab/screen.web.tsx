/**
 * Screen Time Lab — Web fallback variant (FR-010).
 *
 * Identical shape to the Android variant.
 */

import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { ActivityPickerCard } from '@/modules/screentime-lab/components/ActivityPickerCard';
import { AuthorizationCard } from '@/modules/screentime-lab/components/AuthorizationCard';
import { MonitoringCard } from '@/modules/screentime-lab/components/MonitoringCard';
import { ShieldingCard } from '@/modules/screentime-lab/components/ShieldingCard';

const BANNER_TEXT = 'Screen Time API is iOS-only';

const noop = (): void => undefined;

export default function ScreenTimeLabScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ThemedView accessibilityLabel='Platform banner' style={styles.banner}>
        <ThemedText style={styles.bannerText}>{BANNER_TEXT}</ThemedText>
      </ThemedView>
      <AuthorizationCard authStatus='notDetermined' onAuthorized={noop} onError={noop} disabled />
      <ActivityPickerCard
        selectionSummary={null}
        onPicked={noop}
        onCleared={noop}
        onError={noop}
        disabled
      />
      <ShieldingCard
        selectionSummary={null}
        shieldingActive={false}
        onApplied={noop}
        onCleared={noop}
        onError={noop}
        disabled
      />
      <MonitoringCard
        monitoringActive={false}
        selectionSummary={null}
        onStarted={noop}
        onStopped={noop}
        onError={noop}
        disabled
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
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
