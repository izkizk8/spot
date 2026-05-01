/**
 * useControls Hook
 * Feature: 087-controls
 *
 * State machine for the Controls lab. The native bridge is
 * replaceable at the import boundary via __setControlsBridgeForTests
 * for unit tests.
 */
import { useCallback, useState } from 'react';

import controlsDefault from '@/native/controls';
import type {
  ControlActionResult,
  ControlInfo,
  ControlsBridge,
  ControlsCapabilities,
} from '@/native/controls.types';

let mockBridge: ControlsBridge | null = null;

export function __setControlsBridgeForTests(bridge: ControlsBridge | null) {
  mockBridge = bridge;
}

function getBridge(): ControlsBridge {
  if (mockBridge) return mockBridge;
  return controlsDefault;
}

export interface ControlsState {
  capabilities: ControlsCapabilities | null;
  controls: readonly ControlInfo[];
  lastActionResult: ControlActionResult | null;
  loading: boolean;
  lastError: Error | null;
}

export interface ControlsActions {
  refreshCapabilities(): Promise<void>;
  refreshControls(): Promise<void>;
  triggerControl(controlId: string): Promise<ControlActionResult | null>;
}

export function useControls(): ControlsState & ControlsActions {
  const [capabilities, setCapabilities] = useState<ControlsCapabilities | null>(null);
  const [controls, setControls] = useState<readonly ControlInfo[]>([]);
  const [lastActionResult, setLastActionResult] = useState<ControlActionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);

  const refreshCapabilities = useCallback(async () => {
    setLoading(true);
    setLastError(null);
    try {
      const caps = await getBridge().getCapabilities();
      setCapabilities(caps);
    } catch (err) {
      setLastError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshControls = useCallback(async () => {
    setLoading(true);
    setLastError(null);
    try {
      const list = await getBridge().getRegisteredControls();
      setControls(list);
    } catch (err) {
      setLastError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  const triggerControl = useCallback(
    async (controlId: string): Promise<ControlActionResult | null> => {
      setLoading(true);
      setLastError(null);
      try {
        const result = await getBridge().triggerControl(controlId);
        setLastActionResult(result);
        return result;
      } catch (err) {
        setLastError(err as Error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    capabilities,
    controls,
    lastActionResult,
    loading,
    lastError,
    refreshCapabilities,
    refreshControls,
    triggerControl,
  };
}
