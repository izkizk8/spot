/**
 * HomesList — HomeKit Lab (feature 044).
 *
 * Lists every home discovered by `HMHomeManager` with a "Primary"
 * pill marking the primary home. Selecting a home triggers
 * `onSelect(id)`.
 */

import React from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { HomeRecord } from '@/native/homekit.types';

interface HomesListProps {
  readonly homes: readonly HomeRecord[];
  readonly selectedHomeId: string | null;
  readonly onSelect: (id: string) => void;
  readonly style?: ViewStyle;
}

export default function HomesList({ homes, selectedHomeId, onSelect, style }: HomesListProps) {
  const theme = useTheme();

  return (
    <ThemedView style={[styles.container, style]} testID='homekit-homes-card'>
      <ThemedText style={styles.heading}>Homes</ThemedText>
      {homes.length === 0 ? (
        <ThemedText type='small' themeColor='textSecondary' testID='homekit-homes-empty'>
          No homes yet. Use the HomeKit Accessory Simulator on macOS to add a home.
        </ThemedText>
      ) : (
        <View style={styles.rows}>
          {homes.map((home) => {
            const selected = home.id === selectedHomeId;
            return (
              <Pressable
                key={home.id}
                testID={`homekit-home-row-${home.id}`}
                onPress={() => onSelect(home.id)}
                style={[
                  styles.row,
                  {
                    backgroundColor: selected ? theme.backgroundSelected : theme.backgroundElement,
                  },
                ]}
              >
                <ThemedText type='smallBold'>{home.name}</ThemedText>
                {home.isPrimary ? (
                  <View
                    style={[styles.pill, { backgroundColor: theme.tintA }]}
                    testID={`homekit-home-primary-${home.id}`}
                  >
                    <ThemedText type='small' themeColor='background'>
                      Primary
                    </ThemedText>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.two,
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
  },
  rows: {
    gap: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.two,
    borderRadius: Spacing.one,
  },
  pill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.three,
  },
});
