/**
 * RoomsList — HomeKit Lab (feature 044).
 *
 * Lists rooms in the currently-selected home. Tapping a room is a
 * navigational hint only — it filters the AccessoriesList.
 */

import React from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { HomeRecord, RoomRecord } from '@/native/homekit.types';

interface RoomsListProps {
  readonly home: HomeRecord | null;
  readonly selectedRoomId: string | null;
  readonly onSelect: (id: string | null) => void;
  readonly style?: ViewStyle;
}

export default function RoomsList({ home, selectedRoomId, onSelect, style }: RoomsListProps) {
  const theme = useTheme();
  const rooms: readonly RoomRecord[] = home?.rooms ?? [];

  return (
    <ThemedView style={[styles.container, style]} testID='homekit-rooms-card'>
      <ThemedText style={styles.heading}>Rooms</ThemedText>
      {!home ? (
        <ThemedText type='small' themeColor='textSecondary' testID='homekit-rooms-empty'>
          Select a home above to see rooms.
        </ThemedText>
      ) : rooms.length === 0 ? (
        <ThemedText type='small' themeColor='textSecondary' testID='homekit-rooms-empty'>
          This home has no rooms yet.
        </ThemedText>
      ) : (
        <View style={styles.rows}>
          <Pressable
            testID='homekit-room-row-all'
            onPress={() => onSelect(null)}
            style={[
              styles.row,
              {
                backgroundColor:
                  selectedRoomId === null ? theme.backgroundSelected : theme.backgroundElement,
              },
            ]}
          >
            <ThemedText type='smallBold'>All rooms</ThemedText>
          </Pressable>
          {rooms.map((room) => {
            const selected = room.id === selectedRoomId;
            return (
              <Pressable
                key={room.id}
                testID={`homekit-room-row-${room.id}`}
                onPress={() => onSelect(room.id)}
                style={[
                  styles.row,
                  {
                    backgroundColor: selected ? theme.backgroundSelected : theme.backgroundElement,
                  },
                ]}
              >
                <ThemedText type='smallBold'>{room.name}</ThemedText>
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
    padding: Spacing.two,
    borderRadius: Spacing.one,
  },
});
