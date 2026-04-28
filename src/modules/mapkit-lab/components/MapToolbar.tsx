import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { PermissionStatus } from './PermissionsCard';

export type MapType = 'standard' | 'satellite' | 'hybrid' | 'mutedStandard';

const MAP_TYPES: MapType[] = ['standard', 'satellite', 'hybrid', 'mutedStandard'];

const MAP_TYPE_LABEL: Record<MapType, string> = {
  standard: 'Standard',
  satellite: 'Satellite',
  hybrid: 'Hybrid',
  mutedStandard: 'Muted',
};

interface MapToolbarProps {
  mapType: MapType;
  onMapTypeChange: (t: MapType) => void;
  userLocationEnabled: boolean;
  onUserLocationToggle: () => void;
  onRecenter: () => void;
  permissionStatus: PermissionStatus;
}

export function MapToolbar({
  mapType,
  onMapTypeChange,
  userLocationEnabled,
  onUserLocationToggle,
  onRecenter,
  permissionStatus,
}: MapToolbarProps) {
  const theme = useTheme();
  const locationDisabled = permissionStatus !== 'granted';

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.segmentedControl} testID="maptype-segmented-control">
        {MAP_TYPES.map((type) => {
          const selected = type === mapType;
          return (
            <Pressable
              key={type}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              testID={`maptype-segment-${type}`}
              onPress={() => onMapTypeChange(type)}
              style={[
                styles.segment,
                {
                  backgroundColor: selected ? theme.backgroundSelected : theme.backgroundElement,
                },
              ]}
            >
              <ThemedText type="small">{MAP_TYPE_LABEL[type]}</ThemedText>
            </Pressable>
          );
        })}
      </ThemedView>

      <ThemedView style={styles.row}>
        <ThemedView style={styles.rowLabel}>
          <ThemedText type="smallBold">Show user location</ThemedText>
          {locationDisabled ? (
            <ThemedText type="small" themeColor="textSecondary" testID="user-location-hint">
              Grant when-in-use permission to enable
            </ThemedText>
          ) : null}
        </ThemedView>
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ disabled: locationDisabled, checked: userLocationEnabled }}
          disabled={locationDisabled}
          onPress={onUserLocationToggle}
          testID="user-location-switch"
          style={[
            styles.switch,
            {
              backgroundColor: userLocationEnabled ? theme.tintA : theme.backgroundElement,
              opacity: locationDisabled ? 0.5 : 1,
            },
          ]}
        >
          <ThemedView
            style={[
              styles.switchThumb,
              {
                backgroundColor: '#ffffff',
                alignSelf: userLocationEnabled ? 'flex-end' : 'flex-start',
              },
            ]}
          />
        </Pressable>
      </ThemedView>

      <Pressable
        accessibilityRole="button"
        onPress={onRecenter}
        testID="recenter-button"
        style={[styles.recenter, { backgroundColor: theme.backgroundElement }]}
      >
        <ThemedText type="smallBold">Recenter</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  segmentedControl: {
    flexDirection: 'row',
    gap: Spacing.one,
    borderRadius: Spacing.two,
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
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
  recenter: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
