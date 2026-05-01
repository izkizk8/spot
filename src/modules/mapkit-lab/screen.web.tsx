/**
 * MapKit Lab screen — Web variant (feature 024).
 *
 * `MapView` is replaced with `MapPlaceholder` because react-native-maps
 * is iOS/Android-only. Search and LookAround tabs render an
 * `IOSOnlyBanner`. Map-mutating actions (Recenter, Add at center, Draw
 * sample loop) remain present and are wired to the same `useMapState`
 * hook so they update in-memory state but never call native bridges.
 */

import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { AnnotationsPanel } from './components/AnnotationsPanel';
import { IOSOnlyBanner } from './components/IOSOnlyBanner';
import { MapPlaceholder } from './components/MapPlaceholder';
import { MapToolbar } from './components/MapToolbar';
import { PermissionsCard } from './components/PermissionsCard';
import { PolylinePanel } from './components/PolylinePanel';
import { useMapState } from './hooks/useMapState';

type TabKey = 'annotations' | 'polyline' | 'search' | 'lookaround';

const TABS: ReadonlyArray<{ key: TabKey; label: string; testID: string }> = [
  { key: 'annotations', label: 'Annotations', testID: 'annotations-tab' },
  { key: 'polyline', label: 'Polyline', testID: 'polyline-tab' },
  { key: 'search', label: 'Search', testID: 'search-tab' },
  { key: 'lookaround', label: 'LookAround', testID: 'lookaround-tab' },
];

export default function MapKitLabScreen() {
  const theme = useTheme();
  const state = useMapState();
  const [activeTab, setActiveTab] = useState<TabKey>('annotations');

  const handleRequestPermission = async () => {
    // expo-location's web fallback returns 'undetermined' / no-op; we
    // surface that without crashing the screen.
    state.setPermissionStatus('denied');
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.mapWrapper}>
        <MapPlaceholder />
      </ThemedView>

      <ScrollView contentContainerStyle={styles.scroll}>
        <ThemedText type='title' style={styles.title}>
          MapKit Lab
        </ThemedText>

        <MapToolbar
          mapType={state.mapType}
          onMapTypeChange={state.setMapType}
          userLocationEnabled={state.userLocationEnabled}
          onUserLocationToggle={state.toggleUserLocation}
          onRecenter={() => {
            // Inert on web — recenter only mutates in-memory state and
            // never invokes a native bridge.
            void state.recenter();
          }}
          permissionStatus={state.permissionStatus}
        />

        <ThemedView style={styles.tabStrip}>
          {TABS.map((tab) => {
            const selected = tab.key === activeTab;
            return (
              <Pressable
                key={tab.key}
                accessibilityRole='button'
                accessibilityState={{ selected }}
                testID={tab.testID}
                onPress={() => setActiveTab(tab.key)}
                style={[
                  styles.tab,
                  {
                    backgroundColor: selected ? theme.backgroundSelected : theme.backgroundElement,
                  },
                ]}
              >
                <ThemedText type='smallBold'>{tab.label}</ThemedText>
              </Pressable>
            );
          })}
        </ThemedView>

        {activeTab === 'annotations' ? (
          <ThemedView testID='annotations-panel'>
            <AnnotationsPanel
              visibleAnnotationIds={state.visibleAnnotationIds}
              customAnnotations={state.customAnnotations}
              onToggleAnnotation={state.toggleAnnotation}
              onAddAtCenter={state.addAnnotationAtCenter}
            />
          </ThemedView>
        ) : null}

        {activeTab === 'polyline' ? (
          <ThemedView testID='polyline-panel'>
            <PolylinePanel
              hasPolyline={state.polylinePoints.length > 0}
              onDraw={state.drawSampleLoop}
              onClear={state.clearPolyline}
            />
          </ThemedView>
        ) : null}

        {activeTab === 'search' ? (
          <ThemedView testID='search-panel'>
            <IOSOnlyBanner reason='search' />
          </ThemedView>
        ) : null}

        {activeTab === 'lookaround' ? (
          <ThemedView testID='lookaround-panel'>
            <IOSOnlyBanner reason='lookaround' />
          </ThemedView>
        ) : null}

        <PermissionsCard status={state.permissionStatus} onRequest={handleRequestPermission} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapWrapper: {
    height: 300,
    width: '100%',
  },
  scroll: {
    paddingVertical: Spacing.three,
    gap: Spacing.three,
  },
  title: {
    paddingHorizontal: Spacing.three,
  },
  tabStrip: {
    flexDirection: 'row',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
