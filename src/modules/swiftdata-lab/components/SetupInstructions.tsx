/**
 * SetupInstructions Component
 * Feature: 053-swiftdata
 *
 * Documents the project-side setup required to use SwiftData and
 * mentions the optional CloudKit-backed `ModelContainer` flavour.
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
        1. Annotate your model with the `@Model` macro (iOS 17+). Each stored property becomes a
        SwiftData attribute; mark the primary key with `@Attribute(.unique)`.
      </ThemedText>
      <ThemedText style={styles.bullet}>
        2. Create a single `ModelContainer(for: TaskItem.self)` at app launch and inject the
        container with the `.modelContainer(...)` view modifier.
      </ThemedText>
      <ThemedText style={styles.bullet}>
        3. Read tasks with `@Query` for declarative views, or build a `FetchDescriptor` and run it
        on a `ModelContext` for imperative reads.
      </ThemedText>
      <ThemedText style={styles.bullet}>
        4. Mutate via `modelContext.insert(...)`, property assignment, or `modelContext.delete(...)`
        — SwiftData saves automatically on the next event-loop tick.
      </ThemedText>
      <ThemedText style={styles.bullet}>
        5. Optional CloudKit sync: pass a `ModelConfiguration(cloudKitDatabase: .private(...))` to
        the `ModelContainer`. Requires the same iCloud / Push entitlements as feature 052.
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
