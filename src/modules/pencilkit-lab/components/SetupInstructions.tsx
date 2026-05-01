/**
 * SetupInstructions Component
 * Feature: 082-pencilkit
 *
 * Documents the project-side setup required to use PencilKit.
 */

import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

interface SetupInstructionsProps {
  style?: ViewStyle;
}

export default function SetupInstructions({ style }: SetupInstructionsProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.title}>Setup Instructions</ThemedText>
      <ThemedText style={styles.bullet}>
        1. PencilKit is bundled with iOS — no Info.plist entry, capability, or entitlement is
        required. Just `import PencilKit` in Swift.
      </ThemedText>
      <ThemedText style={styles.bullet}>
        2. Host a `PKCanvasView` inside an Expo Module view and forward its bounds to the React
        layout. Wire `PKCanvasViewDelegate` to react to stroke changes.
      </ThemedText>
      <ThemedText style={styles.bullet}>
        3. Drive the toolbar with `PKToolPicker`. Call `setVisible(true, forFirstResponder:)` once
        the canvas becomes the first responder so the floating tool palette appears.
      </ThemedText>
      <ThemedText style={styles.bullet}>
        4. Persist drawings via `PKDrawing.dataRepresentation()` and rehydrate them with
        `PKDrawing(data:)`. The data blob round-trips losslessly across app launches.
      </ThemedText>
      <ThemedText style={styles.bullet}>
        5. Restrict input on shared canvases by setting `drawingPolicy = .pencilOnly` so finger
        touches scroll instead of drawing.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.one,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  bullet: {
    fontSize: 13,
    opacity: 0.85,
  },
});
