/**
 * PhotoPicker Component
 * Feature: 057-photokit
 *
 * Control panel for requesting access and launching PHPickerViewController.
 */

import React from 'react';
import { StyleSheet, TouchableOpacity, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { AuthorizationStatus } from '@/native/photokit.types';

interface PhotoPickerProps {
  authorizationStatus: AuthorizationStatus | null;
  loading: boolean;
  onRequestAccess: () => void;
  onPickPhotos: () => void;
  onClear: () => void;
  style?: ViewStyle;
}

export default function PhotoPicker({
  authorizationStatus,
  loading,
  onRequestAccess,
  onPickPhotos,
  onClear,
  style,
}: PhotoPickerProps) {
  const canPick = authorizationStatus === 'authorized' || authorizationStatus === 'limited';

  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.title}>Controls</ThemedText>

      <TouchableOpacity style={styles.button} onPress={onRequestAccess} disabled={loading}>
        <ThemedText style={styles.buttonText}>Request Access</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, !canPick && styles.buttonDisabled]}
        onPress={onPickPhotos}
        disabled={!canPick || loading}
      >
        <ThemedText style={styles.buttonText}>
          {loading ? 'Opening Picker…' : 'Pick Photos'}
        </ThemedText>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={onClear}>
        <ThemedText style={styles.buttonText}>Clear</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: Spacing.one,
    padding: Spacing.two,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonSecondary: {
    backgroundColor: '#8E8E93',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
