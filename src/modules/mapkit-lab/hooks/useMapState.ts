/**
 * useMapState hook — owns all in-screen state for the MapKit Lab module.
 *
 * Contract: see specs/024-mapkit/plan.md "Hook Contract — useMapState".
 * mountedRef guards setState after unmount (021/022/023 pattern).
 * Custom annotation ids are generated from `Date.now()` + a monotonic ref so
 * tests can drive determinism via `jest.useFakeTimers()` (D-06).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { DEFAULT_FALLBACK_REGION, LANDMARKS, type Region } from '@/modules/mapkit-lab/landmarks';

export type MapType = 'standard' | 'satellite' | 'hybrid' | 'mutedStandard';

export type PermissionStatus = 'undetermined' | 'denied' | 'granted' | 'restricted';

export interface LatLng {
  lat: number;
  lng: number;
}

export type UserAnnotation = {
  kind: 'user-added';
  id: string;
  lat: number;
  lng: number;
};

export interface UseMapState {
  mapType: MapType;
  visibleAnnotationIds: ReadonlySet<string>;
  customAnnotations: ReadonlyArray<UserAnnotation>;
  polylinePoints: ReadonlyArray<LatLng>;
  region: Region;
  permissionStatus: PermissionStatus;
  userLocationEnabled: boolean;

  toggleAnnotation(landmarkId: string): void;
  addAnnotationAtCenter(): void;
  drawSampleLoop(): void;
  clearPolyline(): void;
  setMapType(type: MapType): void;
  setRegion(region: Region): void;
  setPermissionStatus(status: PermissionStatus): void;
  toggleUserLocation(): void;
  recenter(): Promise<void>;
}

const LANDMARK_IDS: ReadonlySet<string> = new Set(LANDMARKS.map((l) => l.id));

export function useMapState(): UseMapState {
  const [mapType, setMapTypeState] = useState<MapType>('standard');
  const [visibleAnnotationIds, setVisibleAnnotationIds] = useState<ReadonlySet<string>>(
    () => new Set<string>(),
  );
  const [customAnnotations, setCustomAnnotations] = useState<ReadonlyArray<UserAnnotation>>([]);
  const [polylinePoints, setPolylinePoints] = useState<ReadonlyArray<LatLng>>([]);
  const [region, setRegionState] = useState<Region>(DEFAULT_FALLBACK_REGION);
  const [permissionStatus, setPermissionStatusState] = useState<PermissionStatus>('undetermined');
  const [userLocationEnabled, setUserLocationEnabled] = useState(false);

  const mountedRef = useRef(true);
  const counterRef = useRef(0);
  const regionRef = useRef(region);
  const permissionRef = useRef(permissionStatus);

  // Keep refs in sync so callbacks always see the latest values without
  // forcing them to re-create on every state change.
  useEffect(() => {
    regionRef.current = region;
  }, [region]);

  useEffect(() => {
    permissionRef.current = permissionStatus;
  }, [permissionStatus]);

  useEffect(() => {
    mountedRef.current = true;

    (async () => {
      const result = await Location.getForegroundPermissionsAsync();
      if (!mountedRef.current) return;
      const status = result.status as PermissionStatus;
      setPermissionStatusState(status);
      if (status !== 'granted') {
        setUserLocationEnabled(false);
      }
    })();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const toggleAnnotation = useCallback((landmarkId: string) => {
    if (!LANDMARK_IDS.has(landmarkId)) return;
    setVisibleAnnotationIds((prev) => {
      const next = new Set(prev);
      if (next.has(landmarkId)) {
        next.delete(landmarkId);
      } else {
        next.add(landmarkId);
      }
      return next;
    });
  }, []);

  const addAnnotationAtCenter = useCallback(() => {
    const center = regionRef.current;
    counterRef.current += 1;
    const id = `user-${Date.now()}-${counterRef.current}`;
    setCustomAnnotations((prev) => [
      ...prev,
      { kind: 'user-added', id, lat: center.lat, lng: center.lng },
    ]);
  }, []);

  const drawSampleLoop = useCallback(() => {
    const { lat, lng, latDelta, lngDelta } = regionRef.current;
    const dLat = latDelta / 4;
    const dLng = lngDelta / 4;
    const angles = [
      0,
      Math.PI / 4,
      Math.PI / 2,
      (3 * Math.PI) / 4,
      Math.PI,
      (5 * Math.PI) / 4,
      (3 * Math.PI) / 2,
      (7 * Math.PI) / 4,
    ];
    const points: LatLng[] = angles.map((theta) => ({
      lat: lat + dLat * Math.sin(theta),
      lng: lng + dLng * Math.cos(theta),
    }));
    points.push(points[0]);
    setPolylinePoints(points);
  }, []);

  const clearPolyline = useCallback(() => {
    setPolylinePoints([]);
  }, []);

  const setMapType = useCallback((type: MapType) => {
    setMapTypeState(type);
  }, []);

  const setRegion = useCallback((next: Region) => {
    setRegionState(next);
  }, []);

  const setPermissionStatus = useCallback((status: PermissionStatus) => {
    setPermissionStatusState(status);
    if (status !== 'granted') {
      setUserLocationEnabled(false);
    }
  }, []);

  const toggleUserLocation = useCallback(() => {
    if (permissionRef.current !== 'granted') return;
    setUserLocationEnabled((prev) => !prev);
  }, []);

  const recenter = useCallback(async () => {
    if (permissionRef.current === 'granted') {
      try {
        const pos = await Location.getCurrentPositionAsync();
        if (!mountedRef.current) return;
        setRegionState({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          latDelta: 0.01,
          lngDelta: 0.01,
        });
      } catch (err) {
        console.warn('useMapState.recenter: getCurrentPositionAsync failed', err);
        if (!mountedRef.current) return;
        setRegionState(DEFAULT_FALLBACK_REGION);
      }
      return;
    }
    if (!mountedRef.current) return;
    setRegionState(DEFAULT_FALLBACK_REGION);
  }, []);

  return {
    mapType,
    visibleAnnotationIds,
    customAnnotations,
    polylinePoints,
    region,
    permissionStatus,
    userLocationEnabled,
    toggleAnnotation,
    addAnnotationAtCenter,
    drawSampleLoop,
    clearPolyline,
    setMapType,
    setRegion,
    setPermissionStatus,
    toggleUserLocation,
    recenter,
  };
}
