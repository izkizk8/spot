/**
 * MapKit Lab screen — Android variant (feature 024).
 *
 * Same shell as the iOS screen but the Search and LookAround tabs render
 * an `IOSOnlyBanner` instead of the live panels because MKLocalSearch and
 * MKLookAroundViewController are iOS-only APIs.
 */

import React, { useState } from 'react';
import * as Location from 'expo-location';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { AnnotationsPanel } from './components/AnnotationsPanel';
import { IOSOnlyBanner } from './components/IOSOnlyBanner';
import { MapToolbar } from './components/MapToolbar';
import { PermissionsCard } from './components/PermissionsCard';
import { PolylinePanel } from './components/PolylinePanel';
import { useMapState } from './hooks/useMapState';
import { LANDMARKS, type Region } from './landmarks';

type TabKey = 'annotations' | 'polyline' | 'search' | 'lookaround';

const TABS: ReadonlyArray<{ key: TabKey; label: string; testID: string }> = [
  { key: 'annotations', label: 'Annotations', testID: 'annotations-tab' },
  { key: 'polyline', label: 'Polyline', testID: 'polyline-tab' },
  { key: 'search', label: 'Search', testID: 'search-tab' },
  { key: 'lookaround', label: 'LookAround', testID: 'lookaround-tab' },
];

function toMapsRegion(r: Region) {
  return {
    latitude: r.lat,
    longitude: r.lng,
    latitudeDelta: r.latDelta,
    longitudeDelta: r.lngDelta,
  };
}

export default function MapKitLabScreen() {
  const theme = useTheme();
  const state = useMapState();
  const [activeTab, setActiveTab] = useState<TabKey>('annotations');

  const handleRegionChangeComplete = (r: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  }) => {
    state.setRegion({
      lat: r.latitude,
      lng: r.longitude,
      latDelta: r.latitudeDelta,
      lngDelta: r.longitudeDelta,
    });
  };

  const handleRequestPermission = async () => {
    const result = await Location.requestForegroundPermissionsAsync();
    state.setPermissionStatus(result.status as typeof state.permissionStatus);
  };

  const visibleLandmarks = LANDMARKS.filter((l) => state.visibleAnnotationIds.has(l.id));

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.mapWrapper}>
        <MapView
          testID="map-view"
          style={styles.map}
          mapType={state.mapType}
          region={toMapsRegion(state.region)}
          showsUserLocation={state.userLocationEnabled}
          onRegionChangeComplete={handleRegionChangeComplete}
        >
          {visibleLandmarks.map((l) => (
            <Marker
              key={l.id}
              identifier={l.id}
              coordinate={{ latitude: l.lat, longitude: l.lng }}
              title={l.name}
              description={l.description}
            />
          ))}
          {state.customAnnotations.map((a) => (
            <Marker
              key={a.id}
              identifier={a.id}
              coordinate={{ latitude: a.lat, longitude: a.lng }}
            />
          ))}
          {state.polylinePoints.length > 0 ? (
            <Polyline
              coordinates={state.polylinePoints.map((p) => ({
                latitude: p.lat,
                longitude: p.lng,
              }))}
              strokeWidth={3}
            />
          ) : null}
        </MapView>
      </ThemedView>

      <ScrollView contentContainerStyle={styles.scroll}>
        <ThemedText type="title" style={styles.title}>
          MapKit Lab
        </ThemedText>

        <MapToolbar
          mapType={state.mapType}
          onMapTypeChange={state.setMapType}
          userLocationEnabled={state.userLocationEnabled}
          onUserLocationToggle={state.toggleUserLocation}
          onRecenter={() => {
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
                accessibilityRole="button"
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
                <ThemedText type="smallBold">{tab.label}</ThemedText>
              </Pressable>
            );
          })}
        </ThemedView>

        {activeTab === 'annotations' ? (
          <ThemedView testID="annotations-panel">
            <AnnotationsPanel
              visibleAnnotationIds={state.visibleAnnotationIds}
              customAnnotations={state.customAnnotations}
              onToggleAnnotation={state.toggleAnnotation}
              onAddAtCenter={state.addAnnotationAtCenter}
            />
          </ThemedView>
        ) : null}

        {activeTab === 'polyline' ? (
          <ThemedView testID="polyline-panel">
            <PolylinePanel
              hasPolyline={state.polylinePoints.length > 0}
              onDraw={state.drawSampleLoop}
              onClear={state.clearPolyline}
            />
          </ThemedView>
        ) : null}

        {activeTab === 'search' ? (
          <ThemedView testID="search-panel">
            <IOSOnlyBanner reason="search" />
          </ThemedView>
        ) : null}

        {activeTab === 'lookaround' ? (
          <ThemedView testID="lookaround-panel">
            <IOSOnlyBanner reason="lookaround" />
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
  map: {
    flex: 1,
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
