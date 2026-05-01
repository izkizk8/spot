/**
 * SetupInstructions — iOS-only walkthrough for adding the
 * SpotShowcaseWidget to the Home Screen.
 *
 * Pure presentation: returns null when the bridge is not available
 * (FR-031) so non-iOS / iOS < 14 users see no irrelevant guidance.
 *
 * @see specs/014-home-widgets/tasks.md T025
 */

import React from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export interface SetupInstructionsProps {
  readonly isAvailable: boolean;
}

interface Step {
  readonly title: string;
  readonly description: string;
  readonly icon: string;
}

const STEPS: readonly Step[] = [
  {
    icon: '🏠',
    title: 'Long-press your Home Screen',
    description: 'Until the apps start jiggling and the "+" button appears in the corner.',
  },
  {
    icon: '➕',
    title: 'Tap the + button and search "Spot"',
    description: 'Pick the SpotShowcaseWidget entry from the list of available widgets.',
  },
  {
    icon: '📐',
    title: 'Choose Small / Medium / Large and Add Widget',
    description: 'The SpotShowcaseWidget renders the values you push from this screen.',
  },
];

export function SetupInstructions({ isAvailable }: SetupInstructionsProps) {
  if (!isAvailable) return null;

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.heading}>Add SpotShowcaseWidget to your Home Screen</ThemedText>
      <ThemedView style={styles.steps}>
        {STEPS.map((step, i) => (
          <ThemedView key={i} style={styles.step}>
            <ThemedText style={styles.stepIndex}>
              {i + 1}. {step.icon}
            </ThemedText>
            <ThemedView style={styles.stepBody}>
              <ThemedText style={styles.stepTitle}>{step.title}</ThemedText>
              <ThemedText style={styles.stepDescription}>{step.description}</ThemedText>
            </ThemedView>
          </ThemedView>
        ))}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: '#D0D1D6',
  },
  heading: {
    fontSize: 16,
    fontWeight: '600',
  },
  steps: {
    gap: Spacing.two,
  },
  step: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
  stepIndex: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 40,
  },
  stepBody: {
    flex: 1,
    gap: Spacing.half,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  stepDescription: {
    fontSize: 13,
    color: '#60646C',
  },
});
