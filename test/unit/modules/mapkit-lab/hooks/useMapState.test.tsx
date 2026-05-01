/**
 * useMapState hook tests (feature 024).
 *
 * Determinism for `addAnnotationAtCenter` ids relies on `jest.useFakeTimers()`
 * pinning `Date.now()`; the hook's monotonic counter ref guarantees uniqueness
 * across rapid calls within the same tick.
 */

import { renderHook, act } from '@testing-library/react-native';
import { useMapState } from '@/modules/mapkit-lab/hooks/useMapState';
import { DEFAULT_FALLBACK_REGION, LANDMARKS } from '@/modules/mapkit-lab/landmarks';

const Location = jest.requireMock(
  'expo-location',
) as typeof import('../../../../__mocks__/expo-location');

async function flushMount() {
  // Allow the mount-time getForegroundPermissionsAsync promise to resolve.
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('useMapState', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('initial state', () => {
    it('matches the contract defaults and seeds permissionStatus from getForegroundPermissionsAsync', async () => {
      Location.__setLocationMock({ status: 'undetermined' });
      const { result } = renderHook(() => useMapState());
      await flushMount();

      expect(result.current.mapType).toBe('standard');
      expect(result.current.visibleAnnotationIds.size).toBe(0);
      expect(result.current.customAnnotations).toEqual([]);
      expect(result.current.polylinePoints).toEqual([]);
      expect(result.current.region).toEqual(DEFAULT_FALLBACK_REGION);
      expect(result.current.userLocationEnabled).toBe(false);
      expect(result.current.permissionStatus).toBe('undetermined');
      expect(Location.getForegroundPermissionsAsync).toHaveBeenCalledTimes(1);
    });

    it('seeds permissionStatus to granted when the OS reports granted at mount', async () => {
      Location.__setLocationMock({ status: 'granted' });
      const { result } = renderHook(() => useMapState());
      await flushMount();
      expect(result.current.permissionStatus).toBe('granted');
    });
  });

  describe('toggleAnnotation', () => {
    it('adds a known landmark id', async () => {
      const { result } = renderHook(() => useMapState());
      await flushMount();

      act(() => {
        result.current.toggleAnnotation(LANDMARKS[0].id);
      });
      expect(result.current.visibleAnnotationIds.has(LANDMARKS[0].id)).toBe(true);
      expect(result.current.visibleAnnotationIds.size).toBe(1);
    });

    it('removes a previously toggled id', async () => {
      const { result } = renderHook(() => useMapState());
      await flushMount();

      act(() => {
        result.current.toggleAnnotation(LANDMARKS[1].id);
      });
      act(() => {
        result.current.toggleAnnotation(LANDMARKS[1].id);
      });
      expect(result.current.visibleAnnotationIds.has(LANDMARKS[1].id)).toBe(false);
      expect(result.current.visibleAnnotationIds.size).toBe(0);
    });

    it('ignores unknown ids without throwing or mutating state', async () => {
      const { result } = renderHook(() => useMapState());
      await flushMount();

      const before = result.current.visibleAnnotationIds;
      act(() => {
        result.current.toggleAnnotation('not-a-landmark');
      });
      expect(result.current.visibleAnnotationIds).toBe(before);
      expect(result.current.visibleAnnotationIds.size).toBe(0);
    });
  });

  describe('addAnnotationAtCenter', () => {
    it('appends a user-added entry at the current region center', async () => {
      const { result } = renderHook(() => useMapState());
      await flushMount();

      act(() => {
        result.current.addAnnotationAtCenter();
      });

      expect(result.current.customAnnotations).toHaveLength(1);
      const entry = result.current.customAnnotations[0];
      expect(entry.kind).toBe('user-added');
      expect(entry.lat).toBe(DEFAULT_FALLBACK_REGION.lat);
      expect(entry.lng).toBe(DEFAULT_FALLBACK_REGION.lng);
      expect(entry.id).toMatch(/^user-\d+-\d+$/);
    });

    it('produces unique ids across multiple calls within the same tick (monotonic counter)', async () => {
      const { result } = renderHook(() => useMapState());
      await flushMount();

      act(() => {
        result.current.addAnnotationAtCenter();
        result.current.addAnnotationAtCenter();
        result.current.addAnnotationAtCenter();
      });

      const ids = result.current.customAnnotations.map((a) => a.id);
      expect(new Set(ids).size).toBe(3);
    });
  });

  describe('drawSampleLoop', () => {
    it('produces ≥4 points whose first equals last (closed loop) within the region span', async () => {
      const { result } = renderHook(() => useMapState());
      await flushMount();

      act(() => {
        result.current.drawSampleLoop();
      });

      const pts = result.current.polylinePoints;
      expect(pts.length).toBeGreaterThanOrEqual(4);
      expect(pts[0]).toEqual(pts[pts.length - 1]);

      const { lat, lng, latDelta, lngDelta } = DEFAULT_FALLBACK_REGION;
      for (const p of pts) {
        expect(Math.abs(p.lat - lat)).toBeLessThanOrEqual(latDelta / 4 + 1e-9);
        expect(Math.abs(p.lng - lng)).toBeLessThanOrEqual(lngDelta / 4 + 1e-9);
      }
    });
  });

  describe('clearPolyline', () => {
    it('empties the polyline array', async () => {
      const { result } = renderHook(() => useMapState());
      await flushMount();

      act(() => {
        result.current.drawSampleLoop();
      });
      expect(result.current.polylinePoints.length).toBeGreaterThan(0);

      act(() => {
        result.current.clearPolyline();
      });
      expect(result.current.polylinePoints).toEqual([]);
    });
  });

  describe('setMapType', () => {
    it('round-trips all four map types', async () => {
      const { result } = renderHook(() => useMapState());
      await flushMount();

      for (const t of ['standard', 'satellite', 'hybrid', 'mutedStandard'] as const) {
        act(() => {
          result.current.setMapType(t);
        });
        expect(result.current.mapType).toBe(t);
      }
    });
  });

  describe('setRegion', () => {
    it('updates the region state', async () => {
      const { result } = renderHook(() => useMapState());
      await flushMount();

      const next = { lat: 1, lng: 2, latDelta: 0.5, lngDelta: 0.5 };
      act(() => {
        result.current.setRegion(next);
      });
      expect(result.current.region).toEqual(next);
    });
  });

  describe('setPermissionStatus', () => {
    it('forces userLocationEnabled to false when leaving granted', async () => {
      Location.__setLocationMock({ status: 'granted' });
      const { result } = renderHook(() => useMapState());
      await flushMount();

      act(() => {
        result.current.toggleUserLocation();
      });
      expect(result.current.userLocationEnabled).toBe(true);

      act(() => {
        result.current.setPermissionStatus('denied');
      });
      expect(result.current.permissionStatus).toBe('denied');
      expect(result.current.userLocationEnabled).toBe(false);
    });
  });

  describe('toggleUserLocation', () => {
    it('is a no-op when permission is not granted', async () => {
      Location.__setLocationMock({ status: 'denied' });
      const { result } = renderHook(() => useMapState());
      await flushMount();

      act(() => {
        result.current.toggleUserLocation();
      });
      expect(result.current.userLocationEnabled).toBe(false);
    });

    it('flips when permission is granted', async () => {
      Location.__setLocationMock({ status: 'granted' });
      const { result } = renderHook(() => useMapState());
      await flushMount();

      act(() => {
        result.current.toggleUserLocation();
      });
      expect(result.current.userLocationEnabled).toBe(true);

      act(() => {
        result.current.toggleUserLocation();
      });
      expect(result.current.userLocationEnabled).toBe(false);
    });
  });

  describe('recenter', () => {
    it('updates region from getCurrentPositionAsync when granted', async () => {
      Location.__setLocationMock({
        status: 'granted',
        coords: { latitude: 12.34, longitude: -56.78 },
      });
      const { result } = renderHook(() => useMapState());
      await flushMount();

      await act(async () => {
        await result.current.recenter();
      });

      expect(Location.getCurrentPositionAsync).toHaveBeenCalledTimes(1);
      expect(result.current.region).toEqual({
        lat: 12.34,
        lng: -56.78,
        latDelta: 0.01,
        lngDelta: 0.01,
      });
    });

    it('falls back to DEFAULT_FALLBACK_REGION and warns once when getCurrentPositionAsync throws', async () => {
      Location.__setLocationMock({ status: 'granted', throwOnGet: true });
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderHook(() => useMapState());
      await flushMount();

      // Move region away from default so the assertion is meaningful.
      act(() => {
        result.current.setRegion({ lat: 0, lng: 0, latDelta: 1, lngDelta: 1 });
      });

      await act(async () => {
        await result.current.recenter();
      });

      expect(result.current.region).toEqual(DEFAULT_FALLBACK_REGION);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      warnSpy.mockRestore();
    });

    it('jumps straight to DEFAULT_FALLBACK_REGION when permission is not granted (no native call)', async () => {
      Location.__setLocationMock({ status: 'denied' });
      const { result } = renderHook(() => useMapState());
      await flushMount();

      act(() => {
        result.current.setRegion({ lat: 0, lng: 0, latDelta: 1, lngDelta: 1 });
      });

      (Location.getCurrentPositionAsync as jest.Mock).mockClear();

      await act(async () => {
        await result.current.recenter();
      });

      expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
      expect(result.current.region).toEqual(DEFAULT_FALLBACK_REGION);
    });
  });
});
