/**
 * useHomeKit — feature 044 / HomeKit Lab.
 *
 * Wraps `src/native/homekit.ts` into a React-friendly state machine.
 * Owns:
 *   - the auth status;
 *   - the list of homes and the currently-selected accessory tree;
 *   - the optional characteristic observer subscription + counter.
 *
 * Contracts:
 *   - `init()` queries the auth status and (if authorized) loads homes.
 *     On unauthorized devices it resolves silently — the UI shows the
 *     "Request access" CTA.
 *   - All async helpers are no-throw: errors surface via `lastError`.
 *   - The hook tears the observer down on unmount and ignores async
 *     completions that resolve after unmount (an internal `aliveRef`
 *     guards every state update).
 *   - The native bridge is loaded via a getter so tests can swap it
 *     out using `__setHomeKitBridgeForTests`.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  type AccessoryRecord,
  type CharacteristicValue,
  type HomeKitAuthStatus,
  type HomeKitBridge,
  type HomeRecord,
} from '@/native/homekit.types';

import defaultBridge from '@/native/homekit';

let bridgeOverride: HomeKitBridge | null = null;

/**
 * Test helper — replaces the bridge resolved by `useHomeKit`. Pass
 * `null` to restore the default bridge. Exported only for tests.
 */
export function __setHomeKitBridgeForTests(b: HomeKitBridge | null): void {
  bridgeOverride = b;
}

function getBridge(): HomeKitBridge {
  return bridgeOverride ?? (defaultBridge as unknown as HomeKitBridge);
}

export interface UseHomeKitReturn {
  readonly available: boolean | null;
  readonly authStatus: HomeKitAuthStatus;
  readonly initialised: boolean;
  readonly lastError: string | null;
  readonly homes: readonly HomeRecord[];
  readonly accessories: readonly AccessoryRecord[];
  readonly selectedHomeId: string | null;
  readonly selectedAccessoryId: string | null;
  readonly selectedCharacteristicId: string | null;
  readonly lastReadValue: CharacteristicValue | null;
  readonly observerActive: boolean;
  readonly observerUpdateCount: number;
  init(): Promise<void>;
  selectHome(id: string | null): void;
  selectAccessory(id: string | null): void;
  selectCharacteristic(id: string | null): void;
  writeValue(value: CharacteristicValue): Promise<void>;
  readValue(): Promise<void>;
  toggleObserver(): void;
  reset(): void;
}

const NO_HOMES: readonly HomeRecord[] = Object.freeze([]);
const NO_ACCESSORIES: readonly AccessoryRecord[] = Object.freeze([]);

export function useHomeKit(): UseHomeKitReturn {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [authStatus, setAuthStatus] = useState<HomeKitAuthStatus>('notDetermined');
  const [initialised, setInitialised] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [homes, setHomes] = useState<readonly HomeRecord[]>(NO_HOMES);
  const [accessories, setAccessories] = useState<readonly AccessoryRecord[]>(NO_ACCESSORIES);
  const [selectedHomeId, setSelectedHomeId] = useState<string | null>(null);
  const [selectedAccessoryId, setSelectedAccessoryId] = useState<string | null>(null);
  const [selectedCharacteristicId, setSelectedCharacteristicId] = useState<string | null>(null);
  const [lastReadValue, setLastReadValue] = useState<CharacteristicValue | null>(null);
  const [observerActive, setObserverActive] = useState(false);
  const [observerUpdateCount, setObserverUpdateCount] = useState(0);

  const aliveRef = useRef(true);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const safeError = useCallback((err: unknown) => {
    if (!aliveRef.current) return;
    const msg = err instanceof Error ? err.message : String(err);
    setLastError(msg);
  }, []);

  const init = useCallback(async () => {
    const bridge = getBridge();
    let avail = false;
    try {
      avail = bridge.isAvailable();
    } catch (err) {
      safeError(err);
    }
    if (!aliveRef.current) return;
    setAvailable(avail);

    let status: HomeKitAuthStatus = 'notDetermined';
    try {
      status = await bridge.requestAccess();
    } catch (err) {
      safeError(err);
      return;
    }
    if (!aliveRef.current) return;
    setAuthStatus(status);
    setInitialised(true);

    if (status !== 'authorized') {
      return;
    }

    try {
      const next = await bridge.getHomes();
      if (!aliveRef.current) return;
      setHomes(next);
      // Auto-select the primary home (or the first one) on first load.
      if (next.length > 0 && selectedHomeId === null) {
        const primary = next.find((h) => h.isPrimary) ?? next[0];
        setSelectedHomeId(primary.id);
      }
    } catch (err) {
      safeError(err);
    }
  }, [safeError, selectedHomeId]);

  // Refresh accessories whenever the selected home changes.
  useEffect(() => {
    if (selectedHomeId === null) {
      return;
    }
    const bridge = getBridge();
    let cancelled = false;
    void bridge
      .getAccessories(selectedHomeId)
      .then((next) => {
        if (cancelled || !aliveRef.current) return;
        setAccessories(next);
      })
      .catch((err) => {
        if (cancelled) return;
        safeError(err);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedHomeId, safeError]);

  // Tear the observer down on unmount.
  useEffect(() => {
    return () => {
      aliveRef.current = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, []);

  const selectHome = useCallback((id: string | null) => {
    setSelectedHomeId(id);
    setSelectedAccessoryId(null);
    setSelectedCharacteristicId(null);
    setLastReadValue(null);
    if (id === null) {
      setAccessories(NO_ACCESSORIES);
    }
  }, []);

  const selectAccessory = useCallback((id: string | null) => {
    setSelectedAccessoryId(id);
    setSelectedCharacteristicId(null);
    setLastReadValue(null);
  }, []);

  const selectCharacteristic = useCallback((id: string | null) => {
    setSelectedCharacteristicId(id);
    setLastReadValue(null);
  }, []);

  const writeValue = useCallback(
    async (value: CharacteristicValue) => {
      if (selectedAccessoryId === null || selectedCharacteristicId === null) {
        safeError(new Error('No characteristic selected'));
        return;
      }
      try {
        await getBridge().writeCharacteristic(selectedAccessoryId, selectedCharacteristicId, value);
        if (!aliveRef.current) return;
        setLastReadValue(value);
      } catch (err) {
        safeError(err);
      }
    },
    [selectedAccessoryId, selectedCharacteristicId, safeError],
  );

  const readValue = useCallback(async () => {
    if (selectedAccessoryId === null || selectedCharacteristicId === null) {
      safeError(new Error('No characteristic selected'));
      return;
    }
    try {
      const v = await getBridge().readCharacteristic(selectedAccessoryId, selectedCharacteristicId);
      if (!aliveRef.current) return;
      setLastReadValue(v);
    } catch (err) {
      safeError(err);
    }
  }, [selectedAccessoryId, selectedCharacteristicId, safeError]);

  const toggleObserver = useCallback(() => {
    if (selectedAccessoryId === null || selectedCharacteristicId === null) {
      safeError(new Error('No characteristic selected'));
      return;
    }
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
      setObserverActive(false);
      return;
    }
    try {
      const unsubscribe = getBridge().observeCharacteristic(
        selectedAccessoryId,
        selectedCharacteristicId,
        (value) => {
          if (!aliveRef.current) return;
          setLastReadValue(value);
          setObserverUpdateCount((n) => n + 1);
        },
      );
      unsubscribeRef.current = unsubscribe;
      setObserverActive(true);
    } catch (err) {
      safeError(err);
    }
  }, [selectedAccessoryId, selectedCharacteristicId, safeError]);

  const reset = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    setLastError(null);
    setObserverActive(false);
    setObserverUpdateCount(0);
    setLastReadValue(null);
  }, []);

  return {
    available,
    authStatus,
    initialised,
    lastError,
    homes,
    accessories,
    selectedHomeId,
    selectedAccessoryId,
    selectedCharacteristicId,
    lastReadValue,
    observerActive,
    observerUpdateCount,
    init,
    selectHome,
    selectAccessory,
    selectCharacteristic,
    writeValue,
    readValue,
    toggleObserver,
    reset,
  };
}
