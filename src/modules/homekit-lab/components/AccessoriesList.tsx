/**
 * AccessoriesList — HomeKit Lab (feature 044).
 *
 * Renders accessories in the selected home, optionally filtered by
 * the selected room. Each accessory expands into a characteristics
 * tree; tapping a characteristic selects it for the editor.
 */

import React from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { AccessoryRecord, CharacteristicRecord } from '@/native/homekit.types';
import { labelForKind } from '../characteristic-types';

interface AccessoriesListProps {
  readonly accessories: readonly AccessoryRecord[];
  readonly selectedRoomId: string | null;
  readonly selectedAccessoryId: string | null;
  readonly selectedCharacteristicId: string | null;
  readonly onSelectAccessory: (id: string) => void;
  readonly onSelectCharacteristic: (id: string) => void;
  readonly style?: ViewStyle;
}

function visible(accessory: AccessoryRecord, roomId: string | null): boolean {
  if (roomId === null) return true;
  return accessory.roomId === roomId;
}

export default function AccessoriesList({
  accessories,
  selectedRoomId,
  selectedAccessoryId,
  selectedCharacteristicId,
  onSelectAccessory,
  onSelectCharacteristic,
  style,
}: AccessoriesListProps) {
  const theme = useTheme();
  const filtered = accessories.filter((a) => visible(a, selectedRoomId));

  return (
    <ThemedView style={[styles.container, style]} testID="homekit-accessories-card">
      <ThemedText style={styles.heading}>Accessories</ThemedText>
      {filtered.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary" testID="homekit-accessories-empty">
          No accessories in the selected scope.
        </ThemedText>
      ) : (
        <View style={styles.rows}>
          {filtered.map((accessory) => {
            const selected = accessory.id === selectedAccessoryId;
            return (
              <View key={accessory.id} testID={`homekit-accessory-${accessory.id}`}>
                <Pressable
                  testID={`homekit-accessory-row-${accessory.id}`}
                  onPress={() => onSelectAccessory(accessory.id)}
                  style={[
                    styles.row,
                    {
                      backgroundColor: selected
                        ? theme.backgroundSelected
                        : theme.backgroundElement,
                    },
                  ]}
                >
                  <ThemedText type="smallBold">{accessory.name}</ThemedText>
                  <ThemedText
                    type="small"
                    themeColor={accessory.reachable ? 'textSecondary' : 'tintB'}
                  >
                    {accessory.reachable ? 'reachable' : 'unreachable'}
                  </ThemedText>
                </Pressable>
                {selected ? (
                  <View style={styles.tree}>
                    {accessory.characteristics.length === 0 ? (
                      <ThemedText
                        type="small"
                        themeColor="textSecondary"
                        testID={`homekit-characteristics-empty-${accessory.id}`}
                      >
                        No characteristics on this accessory.
                      </ThemedText>
                    ) : (
                      accessory.characteristics.map((c: CharacteristicRecord) => {
                        const cSelected = c.id === selectedCharacteristicId;
                        return (
                          <Pressable
                            key={c.id}
                            testID={`homekit-characteristic-row-${c.id}`}
                            onPress={() => onSelectCharacteristic(c.id)}
                            style={[
                              styles.charRow,
                              {
                                backgroundColor: cSelected
                                  ? theme.backgroundSelected
                                  : 'transparent',
                              },
                            ]}
                          >
                            <ThemedText type="small">{c.name}</ThemedText>
                            <ThemedText type="small" themeColor="textSecondary">
                              {labelForKind(c.kind)}
                            </ThemedText>
                          </Pressable>
                        );
                      })
                    )}
                  </View>
                ) : null}
              </View>
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
  tree: {
    marginTop: Spacing.one,
    paddingLeft: Spacing.two,
    gap: Spacing.half,
  },
  charRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.one,
  },
});
