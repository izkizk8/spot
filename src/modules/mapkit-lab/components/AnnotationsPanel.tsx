import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { LANDMARKS } from '@/modules/mapkit-lab/landmarks';

export interface CustomAnnotation {
  kind: 'user-added';
  id: string;
  lat: number;
  lng: number;
}

interface AnnotationsPanelProps {
  visibleAnnotationIds: ReadonlySet<string>;
  customAnnotations: ReadonlyArray<CustomAnnotation>;
  onToggleAnnotation: (id: string) => void;
  onAddAtCenter: () => void;
}

export function AnnotationsPanel({
  visibleAnnotationIds,
  customAnnotations,
  onToggleAnnotation,
  onAddAtCenter,
}: AnnotationsPanelProps) {
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      {LANDMARKS.map((landmark) => {
        const checked = visibleAnnotationIds.has(landmark.id);
        return (
          <ThemedView key={landmark.id} style={styles.row}>
            <ThemedView style={styles.rowLabel}>
              <ThemedText type="smallBold">{landmark.name}</ThemedText>
            </ThemedView>
            <Pressable
              accessibilityRole="switch"
              accessibilityState={{ checked }}
              accessibilityLabel={landmark.name}
              testID={`annotation-toggle-${landmark.id}`}
              onPress={() => onToggleAnnotation(landmark.id)}
              style={[
                styles.switch,
                {
                  backgroundColor: checked ? theme.tintA : theme.backgroundElement,
                },
              ]}
            >
              <ThemedView
                style={[
                  styles.switchThumb,
                  {
                    backgroundColor: '#ffffff',
                    alignSelf: checked ? 'flex-end' : 'flex-start',
                  },
                ]}
              />
            </Pressable>
          </ThemedView>
        );
      })}

      <Pressable
        accessibilityRole="button"
        onPress={onAddAtCenter}
        testID="add-at-center-button"
        style={[styles.addButton, { backgroundColor: theme.backgroundElement }]}
      >
        <ThemedText type="smallBold">Add at center</ThemedText>
      </Pressable>

      <ThemedView style={styles.footer}>
        <ThemedText type="small" themeColor="textSecondary" testID="custom-pin-count">
          {`Custom pins: ${customAnnotations.length}`}
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  rowLabel: {
    flex: 1,
    gap: Spacing.half,
  },
  switch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: Spacing.half,
    justifyContent: 'center',
  },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  addButton: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    alignItems: 'flex-start',
  },
});
