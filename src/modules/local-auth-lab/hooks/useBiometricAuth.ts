/**
 * useBiometricAuth — React hook owning the LocalAuthentication lifecycle.
 *
 * Responsibilities:
 *   - Mount: load capabilities (hasHardware / isEnrolled / types / level)
 *   - authenticate: invoke authenticateAsync, record result + history
 *   - History capped at 10 entries (newest-first)
 *   - Refresh capabilities on demand
 *   - Unmount: guard against post-unmount setState
 */

import React from 'react';

import * as LocalAuth from 'expo-local-authentication';

const HISTORY_CAP = 10;

export interface Capabilities {
  hasHardware: boolean;
  isEnrolled: boolean;
  types: number[];
  securityLevel: number;
}

export interface AuthAttempt {
  timestamp: string;
  success: boolean;
  error?: LocalAuth.LocalAuthenticationError;
  warning?: string;
}

export interface UseBiometricAuth {
  capabilities: Capabilities | null;
  lastResult: AuthAttempt | null;
  history: AuthAttempt[];
  authenticate: (options?: LocalAuth.LocalAuthenticationOptions) => Promise<AuthAttempt>;
  refreshCapabilities: () => Promise<void>;
}

export interface UseBiometricAuthOptions {
  bridgeOverride?: {
    hasHardwareAsync: () => Promise<boolean>;
    isEnrolledAsync: () => Promise<boolean>;
    supportedAuthenticationTypesAsync: () => Promise<number[]>;
    getEnrolledLevelAsync: () => Promise<number>;
    authenticateAsync: (
      o?: LocalAuth.LocalAuthenticationOptions,
    ) => Promise<LocalAuth.LocalAuthenticationResult>;
  };
}

function defaultBridge() {
  return {
    hasHardwareAsync: LocalAuth.hasHardwareAsync,
    isEnrolledAsync: LocalAuth.isEnrolledAsync,
    supportedAuthenticationTypesAsync: LocalAuth.supportedAuthenticationTypesAsync,
    getEnrolledLevelAsync: LocalAuth.getEnrolledLevelAsync,
    authenticateAsync: LocalAuth.authenticateAsync,
  };
}

export function useBiometricAuth(options: UseBiometricAuthOptions = {}): UseBiometricAuth {
  const bridgeRef = React.useRef(options.bridgeOverride ?? defaultBridge());

  const [capabilities, setCapabilities] = React.useState<Capabilities | null>(null);
  const [lastResult, setLastResult] = React.useState<AuthAttempt | null>(null);
  const [history, setHistory] = React.useState<AuthAttempt[]>([]);

  const mountedRef = React.useRef(true);

  const safeSetCapabilities = React.useCallback((next: Capabilities | null) => {
    if (mountedRef.current) setCapabilities(next);
  }, []);

  const safeSetLastResult = React.useCallback((next: AuthAttempt | null) => {
    if (mountedRef.current) setLastResult(next);
  }, []);

  const safeAppendHistory = React.useCallback((entry: AuthAttempt) => {
    if (!mountedRef.current) return;
    setHistory((prev) => [entry, ...prev].slice(0, HISTORY_CAP));
  }, []);

  const refreshCapabilities = React.useCallback(async () => {
    const bridge = bridgeRef.current;
    const [hasHardware, isEnrolled, types, securityLevel] = await Promise.all([
      bridge.hasHardwareAsync().catch(() => false),
      bridge.isEnrolledAsync().catch(() => false),
      bridge.supportedAuthenticationTypesAsync().catch(() => [] as number[]),
      bridge.getEnrolledLevelAsync().catch(() => 0),
    ]);
    safeSetCapabilities({ hasHardware, isEnrolled, types, securityLevel });
  }, [safeSetCapabilities]);

  const authenticate = React.useCallback(
    async (opts?: LocalAuth.LocalAuthenticationOptions): Promise<AuthAttempt> => {
      const timestamp = new Date().toISOString();
      let attempt: AuthAttempt;
      try {
        const result = await bridgeRef.current.authenticateAsync(opts);
        if (result.success) {
          attempt = { timestamp, success: true };
        } else {
          attempt = {
            timestamp,
            success: false,
            error: result.error,
            warning: result.warning,
          };
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn('[local-auth-lab] authenticateAsync threw', message);
        attempt = { timestamp, success: false, error: 'unknown' };
      }
      safeSetLastResult(attempt);
      safeAppendHistory(attempt);
      return attempt;
    },
    [safeSetLastResult, safeAppendHistory],
  );

  // Mount: load capabilities once.
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const bridge = bridgeRef.current;
      const [hasHardware, isEnrolled, types, securityLevel] = await Promise.all([
        bridge.hasHardwareAsync().catch(() => false),
        bridge.isEnrolledAsync().catch(() => false),
        bridge.supportedAuthenticationTypesAsync().catch(() => [] as number[]),
        bridge.getEnrolledLevelAsync().catch(() => 0),
      ]);
      if (cancelled) return;
      safeSetCapabilities({ hasHardware, isEnrolled, types, securityLevel });
    })();

    return () => {
      cancelled = true;
    };
  }, [safeSetCapabilities]);

  // Unmount marker.
  React.useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    capabilities,
    lastResult,
    history,
    authenticate,
    refreshCapabilities,
  };
}
