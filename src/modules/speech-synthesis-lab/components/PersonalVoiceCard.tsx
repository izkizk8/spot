/**
 * PersonalVoiceCard — iOS 17+ Personal Voice authorization surface (US6, T058).
 *
 * Returns null when `status === 'unsupported'` (defensive — the screen also
 * gates the mount per FR-025 / D-08). Renders a status pill and a Request
 * button visible only when status === 'notDetermined'.
 */

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { PersonalVoiceAuthorizationStatus } from '@/modules/speech-synthesis-lab/synth-types';

export interface PersonalVoiceCardProps {
  status: PersonalVoiceAuthorizationStatus;
  onRequest: () => Promise<PersonalVoiceAuthorizationStatus>;
}

const STATUS_LABEL: Record<PersonalVoiceAuthorizationStatus, string> = {
  notDetermined: 'notDetermined',
  authorized: 'authorized',
  denied: 'denied',
  unsupported: 'unsupported',
};

const STATUS_TONE: Record<
  PersonalVoiceAuthorizationStatus,
  'tintA' | 'tintB' | 'textSecondary'
> = {
  notDetermined: 'textSecondary',
  authorized: 'tintA',
  denied: 'tintB',
  unsupported: 'textSecondary',
};

export default function PersonalVoiceCard({ status, onRequest }: PersonalVoiceCardProps) {
  const [busy, setBusy] = React.useState(false);

  if (status === 'unsupported') return null;

  const handlePress = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onRequest();
    } finally {
      setBusy(false);
    }
  };

  return (
    <ThemedView type="backgroundElement" style={styles.card} testID="personal-voice-card">
      <View style={styles.header}>
        <ThemedText type="smallBold">Personal Voice</ThemedText>
        <ThemedText
          type="small"
          themeColor={STATUS_TONE[status]}
          accessibilityRole="text"
          accessibilityLabel={`Personal Voice status: ${STATUS_LABEL[status]}`}
          style={styles.pill}
        >
          {STATUS_LABEL[status]}
        </ThemedText>
      </View>
      {status === 'notDetermined' ? (
        <Pressable
          onPress={handlePress}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Request Personal Voice authorization"
          accessibilityState={{ disabled: busy }}
          style={styles.button}
        >
          <ThemedText type="smallBold" themeColor="tintA">
            Request Personal Voice authorization
          </ThemedText>
        </Pressable>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.one,
    gap: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  button: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    alignSelf: 'flex-start',
  },
});
