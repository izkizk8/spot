/**
 * CoreML Lab screen — iOS variant (feature 016).
 *
 * Full functional path: sample grid → image selection → model load →
 * inference → animated predictions chart + performance metrics.
 */

import React, { useEffect, useReducer } from 'react';
import { ScrollView, StyleSheet, Pressable, Image, Alert } from 'react-native';
import { Asset } from 'expo-asset';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import bridge from '@/native/coreml';
import { coreMLReducer, initialCoreMLState } from './coreml-state';
import { MODEL_REGISTRY } from './model-registry';
import { ImageSourcePicker } from './components/ImageSourcePicker';
import { SampleImageGrid } from './components/SampleImageGrid';
import { PredictionsChart } from './components/PredictionsChart';
import { PerformanceMetrics } from './components/PerformanceMetrics';
import { ModelPicker } from './components/ModelPicker';

export default function CoreMLLabScreen() {
  const [state, dispatch] = useReducer(coreMLReducer, initialCoreMLState);

  // Load the default model on mount
  useEffect(() => {
    if (!bridge.isAvailable()) return;

    const defaultModel = MODEL_REGISTRY[0];
    dispatch({ type: 'modelLoadStart', payload: { name: defaultModel.name } });

    bridge
      .loadModel(defaultModel.name)
      .then((result) => {
        dispatch({
          type: 'modelLoadSuccess',
          payload: { name: result.modelName, computeUnits: result.computeUnits },
        });
      })
      .catch((error) => {
        dispatch({
          type: 'modelLoadFailure',
          payload: { error: error.message || 'Failed to load model' },
        });
      });
  }, []);

  const handleSampleSelect = async (id: string, source: number) => {
    try {
      const asset = Asset.fromModule(source);
      await asset.downloadAsync();
      dispatch({
        type: 'pickImage',
        payload: { source: 'sample', data: asset.localUri || asset.uri },
      });
    } catch (error) {
      console.error('[CoreMLLab] Failed to load sample:', error);
      Alert.alert('Error', 'Failed to load sample image');
    }
  };

  const handlePhotoLibraryPick = (imageData: string) => {
    dispatch({
      type: 'pickImage',
      payload: { source: 'photo', data: imageData },
    });
  };

  const handleClassify = async () => {
    if (!state.imageData || state.status === 'classifying') return;

    dispatch({ type: 'classifyStart' });

    try {
      // Convert image data to base64
      let base64Data = state.imageData;
      if (state.imageData.startsWith('data:image')) {
        base64Data = state.imageData.split(',')[1];
      } else if (state.imageData.startsWith('file://')) {
        // For sample images from Asset.fromModule
        const response = await fetch(state.imageData);
        const blob = await response.blob();
        base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.addEventListener('loadend', () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          });
          reader.addEventListener('error', () => reject(reader.error));
          reader.readAsDataURL(blob);
        });
      }

      const result = await bridge.classify(base64Data);
      dispatch({
        type: 'classifySuccess',
        payload: { predictions: result.predictions, inferenceMs: result.inferenceMs },
      });
    } catch (error: any) {
      dispatch({
        type: 'classifyFailure',
        payload: { error: error.message || 'Classification failed' },
      });
    }
  };

  const handleModelSelect = (modelName: string) => {
    dispatch({ type: 'switchModel', payload: { name: modelName } });
    bridge
      .loadModel(modelName)
      .then((result) => {
        dispatch({
          type: 'modelLoadSuccess',
          payload: { name: result.modelName, computeUnits: result.computeUnits },
        });
      })
      .catch((error) => {
        dispatch({
          type: 'modelLoadFailure',
          payload: { error: error.message || 'Failed to load model' },
        });
      });
  };

  const canClassify =
    state.modelLoaded && state.imageData !== null && state.status !== 'classifying';

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ThemedView style={styles.section}>
          <ThemedText type='title' style={styles.title}>
            CoreML Lab
          </ThemedText>
          <ThemedText type='small' themeColor='textSecondary' style={styles.subtitle}>
            On-device image classification with MobileNetV2
          </ThemedText>
        </ThemedView>

        {state.error && (
          <ThemedView style={styles.errorBanner}>
            <ThemedText type='small' style={styles.errorText}>
              {state.error}
            </ThemedText>
          </ThemedView>
        )}

        <ThemedView style={styles.section}>
          <ImageSourcePicker
            onSourceChange={(source) => {
              if (source === 'sample') {
                // Sample selection happens via grid
              }
            }}
            onImagePicked={handlePhotoLibraryPick}
          />
        </ThemedView>

        <ThemedView style={styles.section}>
          <SampleImageGrid selectedId={null} onSelect={handleSampleSelect} />
        </ThemedView>

        {state.imageData && (
          <ThemedView style={styles.section}>
            <ThemedText type='subtitle' style={styles.sectionTitle}>
              Selected Image
            </ThemedText>
            <Image source={{ uri: state.imageData }} style={styles.preview} />
          </ThemedView>
        )}

        <ThemedView style={styles.section}>
          <Pressable
            style={[styles.classifyButton, !canClassify && styles.classifyButtonDisabled]}
            onPress={handleClassify}
            disabled={!canClassify}
          >
            <ThemedText style={styles.classifyButtonText}>
              {state.status === 'classifying' ? 'Running...' : 'Run Inference'}
            </ThemedText>
          </Pressable>
        </ThemedView>

        <ThemedView style={styles.section}>
          <PredictionsChart predictions={state.predictions} />
        </ThemedView>

        <ThemedView style={styles.section}>
          <PerformanceMetrics
            inferenceMs={state.lastInferenceMs}
            computeUnits={state.computeUnits}
          />
        </ThemedView>

        <ThemedView style={styles.section}>
          <ModelPicker
            models={MODEL_REGISTRY}
            selectedModelId={state.modelName || MODEL_REGISTRY[0].name}
            onSelect={handleModelSelect}
          />
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingVertical: Spacing.three,
  },
  section: {
    marginBottom: Spacing.three,
  },
  title: {
    paddingHorizontal: Spacing.three,
    marginBottom: Spacing.one,
  },
  subtitle: {
    paddingHorizontal: Spacing.three,
  },
  sectionTitle: {
    paddingHorizontal: Spacing.three,
    marginBottom: Spacing.two,
  },
  errorBanner: {
    backgroundColor: '#FF3B30',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.three,
    borderRadius: Spacing.one,
  },
  errorText: {
    color: '#ffffff',
  },
  preview: {
    width: 128,
    height: 128,
    marginHorizontal: Spacing.three,
    borderRadius: Spacing.one,
  },
  classifyButton: {
    backgroundColor: '#007AFF',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    marginHorizontal: Spacing.three,
    borderRadius: Spacing.one,
    alignItems: 'center',
  },
  classifyButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  classifyButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
});
