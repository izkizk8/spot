/**
 * Camera Controls component for Camera Vision (feature 017, User Story 4).
 *
 * Provides camera-flip and flash-mode controls.
 */

import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export interface CameraControlsProps {
  facing: 'back' | 'front';
  flashMode: 'off' | 'auto' | 'on';
  flashAvailable: boolean;
  onFlipCamera: () => void;
  onFlashModeChange: (mode: 'off' | 'auto' | 'on') => void;
}

export function CameraControls({
  facing: _facing,
  flashMode,
  flashAvailable,
  onFlipCamera,
  onFlashModeChange,
}: CameraControlsProps) {
  const handleFlashPress = () => {
    if (!flashAvailable) return;

    const nextMode: Record<'off' | 'auto' | 'on', 'off' | 'auto' | 'on'> = {
      off: 'auto',
      auto: 'on',
      on: 'off',
    };
    onFlashModeChange(nextMode[flashMode]);
  };

  return (
    <ThemedView style={styles.container}>
      <Pressable
        style={styles.button}
        onPress={onFlipCamera}
        accessibilityLabel='Flip camera'
        accessibilityRole='button'
      >
        <ThemedText type='default'>🔄</ThemedText>
      </Pressable>

      {flashAvailable ? (
        <Pressable
          style={styles.button}
          onPress={handleFlashPress}
          accessibilityLabel={`Flash mode: ${flashMode}`}
          accessibilityRole='button'
        >
          <ThemedText type='default'>
            {flashMode === 'off' && '⚡️'}
            {flashMode === 'auto' && '⚡️A'}
            {flashMode === 'on' && '⚡️'}
          </ThemedText>
        </Pressable>
      ) : (
        <ThemedView
          style={[styles.button, styles.buttonDisabled]}
          accessibilityLabel='Flash not available on this camera'
          accessibilityState={{ disabled: true }}
        >
          <ThemedText type='default' style={styles.disabledText}>
            ⚡️
          </ThemedText>
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    justifyContent: 'space-around',
  },
  button: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.one,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.3,
  },
  disabledText: {
    opacity: 0.5,
  },
});
