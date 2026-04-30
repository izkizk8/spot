/**
 * useRoomCapture — feature 048 / LiDAR-RoomPlan Lab.
 *
 * Wraps `src/native/roomplan.ts` and the AsyncStorage-backed
 * `room-store` into a React-friendly state machine. Owns:
 *   - the persisted list of `ScannedRoom`s;
 *   - the currently-selected room id;
 *   - the live scan phase + last bridge error.
 *
 * Contracts:
 *   - All async helpers are no-throw: errors surface via
 *     `lastError`.
 *   - The hook ignores async completions that resolve after
 *     unmount (an internal `aliveRef` guards every state update).
 *   - The native bridge is loaded via a getter so tests can swap
 *     it out using `__setRoomPlanBridgeForTests`.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import defaultBridge from '@/native/roomplan';
import type { RoomCaptureResult, RoomPlanBridge, ScanPhase } from '@/native/roomplan.types';

import * as store from '../room-store';
import type { ScannedRoom } from '../room-store';

let bridgeOverride: RoomPlanBridge | null = null;

/**
 * Test helper — replaces the bridge resolved by
 * `useRoomCapture`. Pass `null` to restore the default bridge.
 * Exported only for tests.
 */
export function __setRoomPlanBridgeForTests(b: RoomPlanBridge | null): void {
  bridgeOverride = b;
}

function getBridge(): RoomPlanBridge {
  return bridgeOverride ?? (defaultBridge as unknown as RoomPlanBridge);
}

function resultToRoom(result: RoomCaptureResult): ScannedRoom {
  return {
    id: result.id,
    name: result.name,
    dimensions: result.dimensions,
    surfaces: result.surfaces,
    createdAt: result.createdAt,
    usdzPath: result.usdzPath,
  };
}

export interface UseRoomCaptureReturn {
  readonly supported: boolean;
  readonly rooms: readonly ScannedRoom[];
  readonly selectedRoomId: string | null;
  readonly selectedRoom: ScannedRoom | null;
  readonly phase: ScanPhase;
  readonly isScanning: boolean;
  readonly lastError: string | null;
  selectRoom(id: string | null): void;
  startScan(): Promise<void>;
  stopScan(): Promise<void>;
  exportSelectedUSDZ(): Promise<string | null>;
  deleteRoom(id: string): Promise<void>;
  reset(): void;
}

export function useRoomCapture(): UseRoomCaptureReturn {
  const [supported] = useState<boolean>(() => {
    try {
      return getBridge().isSupported();
    } catch {
      return false;
    }
  });
  const [rooms, setRooms] = useState<readonly ScannedRoom[]>(store.EMPTY_ROOMS);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [phase, setPhase] = useState<ScanPhase>('idle');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  // Hydrate from storage once on mount.
  useEffect(() => {
    let cancelled = false;
    void store
      .load({
        onError: (err) => {
          if (cancelled || !aliveRef.current) return;
          setLastError(err instanceof Error ? err.message : String(err));
        },
      })
      .then((loaded) => {
        if (cancelled || !aliveRef.current) return;
        setRooms(loaded);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Subscribe to native phase events.
  useEffect(() => {
    const bridge = getBridge();
    let unsubscribe = () => {};
    try {
      unsubscribe = bridge.subscribe((next) => {
        if (!aliveRef.current) return;
        setPhase(next);
      });
    } catch {
      unsubscribe = () => {};
    }
    return () => {
      try {
        unsubscribe();
      } catch {
        /* swallow — defensive */
      }
    };
  }, []);

  const safeError = useCallback((err: unknown) => {
    if (!aliveRef.current) return;
    setLastError(err instanceof Error ? err.message : String(err));
  }, []);

  const persist = useCallback(
    async (next: readonly ScannedRoom[]) => {
      try {
        await store.save(next);
      } catch (err) {
        safeError(err);
      }
    },
    [safeError],
  );

  const selectRoom = useCallback((id: string | null) => {
    setSelectedRoomId(id);
  }, []);

  const startScan = useCallback(async () => {
    const bridge = getBridge();
    setIsScanning(true);
    setLastError(null);
    setPhase('scanning');
    try {
      const result = await bridge.startCapture();
      if (!aliveRef.current) return;
      const room = resultToRoom(result);
      setRooms((prev) => {
        const next = store.addRoom(prev, room);
        void persist(next);
        return next;
      });
      setSelectedRoomId(room.id);
      setPhase('completed');
    } catch (err) {
      safeError(err);
      if (aliveRef.current) setPhase('error');
    } finally {
      if (aliveRef.current) setIsScanning(false);
    }
  }, [safeError, persist]);

  const stopScan = useCallback(async () => {
    const bridge = getBridge();
    try {
      await bridge.stopCapture();
      if (aliveRef.current) {
        setPhase('idle');
        setIsScanning(false);
      }
    } catch (err) {
      safeError(err);
    }
  }, [safeError]);

  const exportSelectedUSDZ = useCallback(async (): Promise<string | null> => {
    const bridge = getBridge();
    if (!selectedRoomId) {
      safeError(new Error('No room selected'));
      return null;
    }
    try {
      const path = await bridge.exportUSDZ(selectedRoomId);
      if (!aliveRef.current) return path;
      setRooms((prev) => {
        const next = store.updateRoom(prev, selectedRoomId, { usdzPath: path });
        void persist(next);
        return next;
      });
      return path;
    } catch (err) {
      safeError(err);
      return null;
    }
  }, [selectedRoomId, safeError, persist]);

  const deleteRoom = useCallback(
    async (id: string) => {
      setRooms((prev) => {
        const next = store.removeRoom(prev, id);
        void persist(next);
        return next;
      });
      if (selectedRoomId === id) {
        setSelectedRoomId(null);
      }
    },
    [selectedRoomId, persist],
  );

  const reset = useCallback(() => {
    setLastError(null);
    setPhase('idle');
    setIsScanning(false);
  }, []);

  const selectedRoom = selectedRoomId ? (rooms.find((r) => r.id === selectedRoomId) ?? null) : null;

  return {
    supported,
    rooms,
    selectedRoomId,
    selectedRoom,
    phase,
    isScanning,
    lastError,
    selectRoom,
    startScan,
    stopScan,
    exportSelectedUSDZ,
    deleteRoom,
    reset,
  };
}
