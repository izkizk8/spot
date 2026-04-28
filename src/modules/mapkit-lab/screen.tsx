/**
 * MapKit Lab screen — iOS / default variant (feature 024).
 *
 * Composes `useMapState` with `MapView` (react-native-maps), the
 * MapToolbar, the BottomTabs panel switcher, and PermissionsCard.
 *
 * Platform.OS / Platform.Version is read here only to derive the single
 * boolean `iosVersionAtLeast16` for the LookAround tab gate (allowed by
 * Constitution III — single-value derivation, not a branch).
 */

import React from 'react';
import * as Location from 'expo-location';
import { Platform, ScrollView, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import lookAroundBridge from '@/native/lookaround';
import searchBridge from '@/native/mapkit-search';

import { BottomTabs } from './components/BottomTabs';
import { MapToolbar } from './components/MapToolbar';
import { PermissionsCard } from './components/PermissionsCard';
import { useMapState } from './hooks/useMapState';
import { LANDMARKS, type Region } from './landmarks';

function toMapsRegion(r: Region) {
  return {
    latitude: r.lat,
    longitude: r.lng,
    latitudeDelta: r.latDelta,
    longitudeDelta: r.lngDelta,
  };
}

export default function MapKitLabScreen() {
  const state = useMapState();

  const iosVersionAtLeast16 = Platform.OS === 'ios' && Number(Platform.Version) >= 16;

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

        <BottomTabs
          state={state}
          searchBridge={searchBridge}
          lookAroundBridge={lookAroundBridge}
          iosVersionAtLeast16={iosVersionAtLeast16}
        />

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
});
