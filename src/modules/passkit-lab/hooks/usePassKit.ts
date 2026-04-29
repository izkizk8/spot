/**
 * usePassKit hook.
 * Feature: 036-passkit-wallet
 *
 * Contracts: H1–H10
 *
 * @see specs/036-passkit-wallet/contracts/usePassKit-hook.md
 */

import { useCallback, useEffect, useReducer, useRef } from 'react';

import type { Capabilities, PassMetadata } from '@/native/passkit.types';
import {
  PassKitCancelled,
  PassKitDownloadFailed,
  PassKitInvalidPass,
  PassKitNotSupported,
  PassKitOpenUnsupported,
} from '@/native/passkit.types';
import * as PassKitBridge from '@/native/passkit';

import * as PassKitLabConfig from '../config';

/**
 * Classified error for UI display.
 * Contract: H7 (R-D)
 */
export interface ClassifiedError {
  type:
    | 'notSupported'
    | 'openUnsupported'
    | 'downloadFailed'
    | 'invalidPass'
    | 'cancelled'
    | 'failed';
  message: string;
}

/**
 * Entitlement status for placeholder detection.
 * Contract: H10
 */
export interface EntitlementStatus {
  isPlaceholder: boolean;
}

/**
 * Hook state shape.
 * Contract: H1, H2
 */
interface State {
  capabilities: Capabilities;
  passes: PassMetadata[];
  inFlight: boolean;
  lastError: ClassifiedError | null;
  lastResult: { added: boolean } | null;
}

type Action =
  | { type: 'REFRESH_START' }
  | {
      type: 'REFRESH_SUCCESS';
      capabilities: Capabilities;
      passes: PassMetadata[];
    }
  | { type: 'REFRESH_ERROR'; error: ClassifiedError }
  | { type: 'ADD_START' }
  | { type: 'ADD_SUCCESS'; result: { added: boolean } }
  | { type: 'ADD_ERROR'; error: ClassifiedError };

const initialState: State = {
  capabilities: { isPassLibraryAvailable: false, canAddPasses: false },
  passes: [],
  inFlight: false,
  lastError: null,
  lastResult: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'REFRESH_START':
      return { ...state, inFlight: true, lastError: null };
    case 'REFRESH_SUCCESS':
      return {
        ...state,
        capabilities: action.capabilities,
        passes: action.passes,
        inFlight: false,
        lastError: null,
      };
    case 'REFRESH_ERROR':
      return { ...state, inFlight: false, lastError: action.error };
    case 'ADD_START':
      return { ...state, inFlight: true, lastError: null, lastResult: null };
    case 'ADD_SUCCESS':
      return {
        ...state,
        inFlight: false,
        lastResult: action.result,
        lastError: null,
      };
    case 'ADD_ERROR':
      return {
        ...state,
        inFlight: false,
        lastError: action.error,
        lastResult: null,
      };
    default:
      return state;
  }
}

/**
 * Classify bridge errors per contract H7 (R-D).
 */
function classifyError(err: unknown): ClassifiedError {
  if (err instanceof PassKitNotSupported) {
    return { type: 'notSupported', message: 'PassKit not supported on this platform' };
  }
  if (err instanceof PassKitOpenUnsupported) {
    return { type: 'openUnsupported', message: 'Open in Wallet requires iOS 13.4+' };
  }
  if (err instanceof PassKitDownloadFailed) {
    return { type: 'downloadFailed', message: 'Download failed' };
  }
  if (err instanceof PassKitInvalidPass) {
    return { type: 'invalidPass', message: 'Pass invalid or unsigned' };
  }
  if (err instanceof PassKitCancelled) {
    return { type: 'cancelled', message: 'Cancelled' };
  }
  if (err instanceof Error) {
    return { type: 'failed', message: err.message };
  }
  return { type: 'failed', message: String(err) };
}

/**
 * Detect placeholder entitlement.
 * Contract: H10
 */
function detectPlaceholderEntitlement(entitlement: readonly string[]): boolean {
  if (entitlement.length === 0) {
    return true;
  }
  return entitlement.some((id) => id.includes('pass.example.placeholder'));
}

/**
 * usePassKit hook.
 * Contract: H1
 */
export function usePassKit() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const mounted = useRef(true);
  const entitlementStatus: EntitlementStatus = {
    isPlaceholder: detectPlaceholderEntitlement(PassKitLabConfig.PASSKIT_ENTITLEMENT),
  };

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  /**
   * refresh() — load capabilities and passes.
   * Contract: H3, H4
   */
  const refresh = useCallback(async () => {
    if (!mounted.current) return;
    dispatch({ type: 'REFRESH_START' });

    try {
      const [canAddPasses, isPassLibraryAvailable, passes] = await Promise.all([
        PassKitBridge.canAddPasses(),
        PassKitBridge.isPassLibraryAvailable(),
        PassKitBridge.passes(),
      ]);

      if (!mounted.current) return;

      dispatch({
        type: 'REFRESH_SUCCESS',
        capabilities: { canAddPasses, isPassLibraryAvailable },
        passes,
      });
    } catch (err) {
      if (!mounted.current) return;
      dispatch({ type: 'REFRESH_ERROR', error: classifyError(err) });
    }
  }, []);

  /**
   * addFromBytes() — add pass from base64 data.
   * Contract: H5
   */
  const addFromBytes = useCallback(async (base64: string) => {
    if (!mounted.current) return;
    dispatch({ type: 'ADD_START' });

    try {
      const result = await PassKitBridge.addPassFromBytes(base64);
      if (!mounted.current) return;

      if (result.added) {
        dispatch({ type: 'ADD_SUCCESS', result });
      } else {
        // User cancelled
        dispatch({
          type: 'ADD_ERROR',
          error: { type: 'cancelled', message: 'Cancelled' },
        });
      }
    } catch (err) {
      if (!mounted.current) return;
      dispatch({ type: 'ADD_ERROR', error: classifyError(err) });
    }
  }, []);

  /**
   * addFromURL() — add pass from URL.
   * Contract: H5
   */
  const addFromURL = useCallback(async (url: string) => {
    if (!mounted.current) return;
    dispatch({ type: 'ADD_START' });

    try {
      const result = await PassKitBridge.addPassFromURL(url);
      if (!mounted.current) return;

      if (result.added) {
        dispatch({ type: 'ADD_SUCCESS', result });
      } else {
        // User cancelled
        dispatch({
          type: 'ADD_ERROR',
          error: { type: 'cancelled', message: 'Cancelled' },
        });
      }
    } catch (err) {
      if (!mounted.current) return;
      dispatch({ type: 'ADD_ERROR', error: classifyError(err) });
    }
  }, []);

  /**
   * openPass() — open pass in Wallet app.
   * Contract: H6
   */
  const openPass = useCallback(async (passTypeIdentifier: string, serialNumber: string) => {
    if (!mounted.current) return;
    dispatch({ type: 'ADD_START' });

    try {
      await PassKitBridge.openPass(passTypeIdentifier, serialNumber);
      if (!mounted.current) return;
      dispatch({
        type: 'ADD_SUCCESS',
        result: { added: false }, // openPass doesn't add, just opens
      });
    } catch (err) {
      if (!mounted.current) return;
      dispatch({ type: 'ADD_ERROR', error: classifyError(err) });
    }
  }, []);

  // H3: Call refresh() on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    ...state,
    refresh,
    addFromBytes,
    addFromURL,
    openPass,
    entitlementStatus,
  };
}
