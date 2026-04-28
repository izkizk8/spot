/**
 * AuthStatusPill — visual + interactive surface for SFSpeechRecognizer auth.
 *
 * Renders a colored pill labelled per `status`. When `status === 'notDetermined'`
 * a Request button is rendered; pressing it invokes `onRequestPress`. For
 * `denied` / `restricted`, an inline Settings affordance is rendered as a
 * placeholder — full deep-link wiring lands in US4 (FR-010).
 */

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { AuthStatus } from '@/modules/speech-recognition-lab/speech-types';

export interface AuthStatusPillProps {
  status: AuthStatus;
  onRequestPress?: () => void;
  onOpenSettingsPress?: () => void;
}

const LABELS: Record<AuthStatus, string> = {
  notDetermined: 'Not determined',
  denied: 'Denied',
  restricted: 'Restricted',
  authorized: 'Authorized',
};

export default function AuthStatusPill({
  status,
  onRequestPress,
  onOpenSettingsPress,
}: AuthStatusPillProps) {
  const label = LABELS[status];

  return (
    <View style={styles.row}>
      <ThemedView
        type="backgroundElement"
        style={styles.pill}
        accessibilityRole="header"
        accessibilityLabel={`Authorization status: ${label}`}
        accessibilityState={{
          selected: status === 'authorized',
          disabled: status === 'restricted',
        }}
      >
        <ThemedText type="smallBold">{label}</ThemedText>
      </ThemedView>

      {status === 'notDetermined' ? (
        <Pressable
          onPress={onRequestPress}
          accessibilityRole="button"
          accessibilityLabel="Request speech recognition permission"
          style={styles.button}
        >
          <ThemedText type="smallBold" themeColor="tintA">
            Request
          </ThemedText>
        </Pressable>
      ) : null}

      {status === 'denied' || status === 'restricted' ? (
        <Pressable
          onPress={onOpenSettingsPress}
          accessibilityRole="link"
          accessibilityLabel="Open Settings to enable"
          style={styles.button}
        >
          <ThemedText type="smallBold" themeColor="tintA">
            Open Settings
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  pill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.four,
  },
  button: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
});
