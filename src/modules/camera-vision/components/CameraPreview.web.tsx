/**
 * Camera Preview component — Web variant (feature 017, User Story 5).
 *
 * Static placeholder for web platform.
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export interface CameraPreviewProps {
  facing?: 'back' | 'front';
  flashMode?: 'off' | 'auto' | 'on';
}

export const CameraPreview = React.forwardRef<any, CameraPreviewProps>(
  ({ facing: _facing = 'back', flashMode: _flashMode = 'off' }, _ref) => {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="default" style={styles.text}>
          Camera not available in this browser
        </ThemedText>
      </ThemedView>
    );
  },
);

CameraPreview.displayName = 'CameraPreview';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  text: {
    textAlign: 'center',
  },
});
