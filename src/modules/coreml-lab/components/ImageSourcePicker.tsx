/**
 * Image Source Picker component for CoreML Lab (feature 016).
 *
 * Provides two options: pick a sample image from the bundled grid,
 * or pick from the Photo Library using expo-image-picker.
 */

import React from 'react';
import { Pressable, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export interface ImageSourcePickerProps {
  onSourceChange: (source: 'sample' | 'library') => void;
  onImagePicked?: (imageData: string) => void;
  onPermissionDenied?: () => void;
}

export function ImageSourcePicker({
  onSourceChange,
  onImagePicked,
  onPermissionDenied,
}: ImageSourcePickerProps) {
  const handlePhotoLibrary = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        onPermissionDenied?.();
        Alert.alert('Permission Required', 'Photo Library access is required to pick images.');
        return;
      }

      // Launch picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images' as any,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.base64) {
          onSourceChange('library');
          onImagePicked?.(`data:image/jpeg;base64,${asset.base64}`);
        }
      }
      // User cancelled — no-op
    } catch (error) {
      console.error('[ImageSourcePicker] Photo library error:', error);
      Alert.alert('Error', 'Failed to pick image from Photo Library.');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Pressable style={styles.button} onPress={() => onSourceChange('sample')}>
        <ThemedText style={styles.buttonText}>Pick a sample image</ThemedText>
      </Pressable>
      <Pressable style={styles.button} onPress={handlePhotoLibrary}>
        <ThemedText style={styles.buttonText}>Pick from Photo Library</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.one,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
