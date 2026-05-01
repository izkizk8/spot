/**
 * RoomDetailView — LiDAR / RoomPlan Lab (feature 048).
 *
 * Renders the selected room's dimensions plus a per-category
 * surfaces breakdown (walls / windows / doors / openings /
 * objects). The Export USDZ button is rendered as a child via
 * the `slot` prop so the parent can wire it to the share-sheet
 * bridge. Pure presentational.
 */

import React, { type ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { ScannedRoom } from '../room-store';
import { formatDimensions, formatFeetInches, formatMeters } from '../units-utils';

interface RoomDetailViewProps {
  readonly style?: ViewStyle;
  readonly room: ScannedRoom | null;
  /** Optional Export-USDZ button injected by the parent. */
  readonly exportSlot?: ReactNode;
}

export default function RoomDetailView({ style, room, exportSlot }: RoomDetailViewProps) {
  if (!room) {
    return (
      <ThemedView
        style={[styles.container, style]}
        type='backgroundElement'
        testID='roomplan-room-detail'
      >
        <ThemedText type='smallBold'>Selected room</ThemedText>
        <ThemedText type='small' themeColor='textSecondary' testID='roomplan-room-detail-empty'>
          Select a captured room from the list to inspect its dimensions, surfaces, and exported
          USDZ asset.
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView
      style={[styles.container, style]}
      type='backgroundElement'
      testID='roomplan-room-detail'
    >
      <ThemedText type='smallBold'>{room.name}</ThemedText>

      <ThemedText type='small' themeColor='textSecondary'>
        Captured: {room.createdAt}
      </ThemedText>

      <View style={styles.section}>
        <ThemedText type='smallBold'>Dimensions</ThemedText>
        <ThemedText type='small' testID='roomplan-detail-dimensions'>
          {formatDimensions(room.dimensions)}
        </ThemedText>
        <ThemedText type='small' themeColor='textSecondary' testID='roomplan-detail-imperial'>
          {formatFeetInches(room.dimensions.widthM)} × {formatFeetInches(room.dimensions.lengthM)} ×{' '}
          {formatFeetInches(room.dimensions.heightM)}
        </ThemedText>
        <ThemedText type='small' themeColor='textSecondary'>
          Height: {formatMeters(room.dimensions.heightM)}
        </ThemedText>
      </View>

      <View style={styles.section}>
        <ThemedText type='smallBold'>Surfaces</ThemedText>
        <ThemedText type='small' testID='roomplan-detail-walls'>
          Walls: {room.surfaces.walls}
        </ThemedText>
        <ThemedText type='small' testID='roomplan-detail-windows'>
          Windows: {room.surfaces.windows}
        </ThemedText>
        <ThemedText type='small' testID='roomplan-detail-doors'>
          Doors: {room.surfaces.doors}
        </ThemedText>
        <ThemedText type='small' testID='roomplan-detail-openings'>
          Openings: {room.surfaces.openings}
        </ThemedText>
        <ThemedText type='small' testID='roomplan-detail-objects'>
          Objects: {room.surfaces.objects}
        </ThemedText>
      </View>

      <View style={styles.section}>
        <ThemedText type='smallBold'>USDZ asset</ThemedText>
        <ThemedText type='small' themeColor='textSecondary' testID='roomplan-detail-usdz-path'>
          {room.usdzPath ?? 'Not exported yet.'}
        </ThemedText>
        {exportSlot}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.two,
    borderRadius: Spacing.two,
  },
  section: {
    gap: Spacing.one,
  },
});
