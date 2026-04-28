/**
 * StatusPanel — bridge availability + current lock config summary + next refresh (iOS 16+ only).
 *
 * On iOS 16+ (via bridge.getLockConfig), displays:
 *  - Current lock config summary (showcaseValue / counter / tint)
 *  - "Next refresh" line (iOS 16+ only - FR-LW-025)
 *
 * On Android/Web/iOS < 16, reads from AsyncStorage shadow store and hides
 * the "Next refresh" line (FR-LW-025, FR-LW-037).
 *
 * @see specs/027-lock-screen-widgets/tasks.md T025, T030
 * @see specs/027-lock-screen-widgets/contracts/lock-config.contract.ts
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, Platform } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import {
  type LockConfig,
  DEFAULT_LOCK_CONFIG,
  loadShadowLockConfig,
} from '@/modules/lock-widgets-lab/lock-config';
import * as WidgetCenterBridge from '@/native/widget-center';
import { WidgetCenterBridgeError } from '@/native/widget-center.types';

const REFRESH_INTERVAL_MS = 30 * 60 * 1000;

export interface StatusPanelProps {
  readonly version: number;
  readonly lastPushedAt: number;
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString();
}

function isIOS16Plus(): boolean {
  if (Platform.OS !== 'ios') return false;
  const version = typeof Platform.Version === 'string' ? parseFloat(Platform.Version) : Platform.Version;
  return version >= 16;
}

export function StatusPanel({ version, lastPushedAt }: StatusPanelProps) {
  const [config, setConfig] = useState<LockConfig>(DEFAULT_LOCK_CONFIG);
  const [hasError, setHasError] = useState(false);
  const [next] = useState(() => new Date(Date.now() + REFRESH_INTERVAL_MS));

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setHasError(false);
        if (isIOS16Plus()) {
          const fetchedConfig = await WidgetCenterBridge.getLockConfig();
          setConfig(fetchedConfig);
        } else {
          // Android / Web / iOS < 16: read from AsyncStorage shadow
          const shadowConfig = await loadShadowLockConfig();
          setConfig(shadowConfig);
        }
      } catch (error) {
        if (error instanceof WidgetCenterBridgeError) {
          // Bridge error - fall back to default
          setHasError(true);
          setConfig(DEFAULT_LOCK_CONFIG);
        } else {
          // AsyncStorage error - already handled by loadShadowLockConfig
          setConfig(DEFAULT_LOCK_CONFIG);
        }
      }
    };

    fetchConfig();
  }, [version, lastPushedAt]);

  const showNextRefresh = isIOS16Plus();

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.heading}>Status</ThemedText>
      {hasError && (
        <ThemedText style={styles.errorLine}>Error loading config from bridge</ThemedText>
      )}
      <ThemedText style={styles.line}>
        {config.showcaseValue} · {config.counter}
      </ThemedText>
      <ThemedText style={styles.line} accessibilityLabel={`Tint: ${config.tint}`}>
        Tint: {config.tint}
      </ThemedText>
      {showNextRefresh && (
        <ThemedText style={styles.line} accessibilityLabel="Next refresh time">
          Next refresh ≈ {formatTime(next)}
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: '#D0D1D6',
  },
  heading: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.one,
  },
  line: {
    fontSize: 13,
  },
  errorLine: {
    fontSize: 13,
    color: '#D32F2F',
  },
});
