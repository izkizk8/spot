/**
 * TransportControls — Speak / Pause / Continue / Stop quad (US1, T029).
 *
 * Enabled-state derivation strictly per FR-019 + FR-021 (table in T025):
 *   - status === 'idle'    : Speak enabled (when canSpeak); Pause/Continue/Stop disabled
 *   - status === 'speaking': Pause + Stop enabled; Speak + Continue disabled
 *   - status === 'paused'  : Continue + Stop enabled; Speak + Pause disabled
 *   - pauseSupported === false: Pause + Continue rendered disabled in every state
 */

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { TransportState } from '@/modules/speech-synthesis-lab/synth-types';

export interface TransportControlsProps {
  status: TransportState;
  canSpeak: boolean;
  pauseSupported: boolean;
  onSpeak: () => void;
  onPause: () => void;
  onContinue: () => void;
  onStop: () => void;
}

interface ButtonProps {
  label: string;
  disabled: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}

function TransportButton({ label, disabled, onPress, accessibilityLabel }: ButtonProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => {
        if (disabled) return;
        onPress();
      }}
      disabled={disabled}
      accessibilityRole='button'
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={[
        styles.button,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.backgroundSelected,
        },
        disabled && styles.disabled,
      ]}
    >
      <ThemedText type='smallBold' themeColor={disabled ? 'textSecondary' : 'tintA'}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

export default function TransportControls({
  status,
  canSpeak,
  pauseSupported,
  onSpeak,
  onPause,
  onContinue,
  onStop,
}: TransportControlsProps) {
  const speakDisabled = status !== 'idle' || !canSpeak;
  const pauseDisabled = !pauseSupported || status !== 'speaking';
  const continueDisabled = !pauseSupported || status !== 'paused';
  const stopDisabled = status === 'idle';

  return (
    <View style={styles.row}>
      <TransportButton
        label='Speak'
        disabled={speakDisabled}
        onPress={onSpeak}
        accessibilityLabel='Speak'
      />
      <TransportButton
        label='Pause'
        disabled={pauseDisabled}
        onPress={onPause}
        accessibilityLabel='Pause'
      />
      <TransportButton
        label='Continue'
        disabled={continueDisabled}
        onPress={onContinue}
        accessibilityLabel='Continue'
      />
      <TransportButton
        label='Stop'
        disabled={stopDisabled}
        onPress={onStop}
        accessibilityLabel='Stop'
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  button: {
    flex: 1,
    minWidth: 72,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.one,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
});
