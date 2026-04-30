/**
 * RoomsList — LiDAR / RoomPlan Lab (feature 048).
 *
 * Lists previously-captured rooms with name, dimensions, total
 * surface count, and creation timestamp. Tapping a row selects
 * the room for the detail view; the trash icon deletes it.
 * Pure presentational + controlled.
 */

import React, { useCallback } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { ScannedRoom } from '../room-store';
import { formatDimensions, totalSurfaces } from '../units-utils';

interface RoomsListProps {
  readonly style?: ViewStyle;
  readonly rooms: readonly ScannedRoom[];
  readonly selectedRoomId: string | null;
  readonly onSelect: (id: string) => void;
  readonly onDelete: (id: string) => void;
}

interface RowProps {
  readonly room: ScannedRoom;
  readonly selected: boolean;
  readonly onSelect: (id: string) => void;
  readonly onDelete: (id: string) => void;
}

function Row({ room, selected, onSelect, onDelete }: RowProps) {
  const handleSelect = useCallback(() => onSelect(room.id), [room.id, onSelect]);
  const handleDelete = useCallback(() => onDelete(room.id), [room.id, onDelete]);
  return (
    <View style={styles.row} testID={`roomplan-room-${room.id}`}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected }}
        onPress={handleSelect}
        style={[styles.rowMain, selected && styles.rowSelected]}
        testID={`roomplan-select-room-${room.id}`}
      >
        <ThemedText type={selected ? 'smallBold' : 'small'}>{room.name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {formatDimensions(room.dimensions)} · {totalSurfaces(room.surfaces)} surfaces ·{' '}
          {room.createdAt}
        </ThemedText>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Delete ${room.name}`}
        onPress={handleDelete}
        style={styles.delete}
        testID={`roomplan-delete-room-${room.id}`}
      >
        <ThemedText type="smallBold">🗑</ThemedText>
      </Pressable>
    </View>
  );
}

export default function RoomsList({
  style,
  rooms,
  selectedRoomId,
  onSelect,
  onDelete,
}: RoomsListProps) {
  return (
    <ThemedView
      style={[styles.container, style]}
      type="backgroundElement"
      testID="roomplan-rooms-list"
    >
      <ThemedText type="smallBold">Captured rooms ({rooms.length})</ThemedText>
      {rooms.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary" testID="roomplan-rooms-empty">
          No captured rooms yet. Run a scan to populate this list.
        </ThemedText>
      ) : (
        <View style={styles.list}>
          {rooms.map((r) => (
            <Row
              key={r.id}
              room={r}
              selected={r.id === selectedRoomId}
              onSelect={onSelect}
              onDelete={onDelete}
            />
          ))}
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.two,
    borderRadius: Spacing.two,
  },
  list: {
    gap: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  rowMain: {
    flex: 1,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.one,
  },
  rowSelected: {
    backgroundColor: 'rgba(120,120,255,0.15)',
  },
  delete: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.one,
  },
});
