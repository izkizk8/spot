/**
 * Camera Preview component for Camera Vision (feature 017).
 *
 * Wraps expo-camera's CameraView and forwards essential props.
 * Default variant for iOS and Android.
 */

import React, { forwardRef } from 'react';
import { StyleSheet } from 'react-native';
import { CameraView } from 'expo-camera';

export interface CameraPreviewProps {
  facing?: 'back' | 'front';
  flashMode?: 'off' | 'auto' | 'on';
}

export const CameraPreview = forwardRef<CameraView, CameraPreviewProps>(
  ({ facing = 'back', flashMode = 'off' }, ref) => {
    return (
      <CameraView
        ref={ref}
        style={styles.camera}
        facing={facing}
        flash={flashMode}
      />
    );
  }
);

CameraPreview.displayName = 'CameraPreview';

const styles = StyleSheet.create({
  camera: {
    flex: 1,
  },
});
