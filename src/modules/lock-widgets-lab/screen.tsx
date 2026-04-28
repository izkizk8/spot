/**
 * Lock Widgets Lab — iOS 16+ variant.
 *
 * Orchestrates StatusPanel + ConfigPanel + AccessoryPreview + Push button +
 * SetupInstructions + ReloadEventLog (FR-LW-024 order).
 *
 * Reads/writes lock config via the WidgetCenter bridge (App Group on iOS 16+).
 * Maintains a 10-capacity ring buffer of ReloadEvents in a useReducer.
 *
 * @see specs/027-lock-screen-widgets/tasks.md T036, T039
 */

import React, { useCallback, useEffect, useReducer, useState } from 'react';
import { ScrollView, StyleSheet, Platform } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import bridge from '@/native/widget-center';
import { ConfigPanel } from '@/modules/lock-widgets-lab/components/ConfigPanel';
import {
  ReloadEventLog,
  type ReloadEvent,
} from '@/modules/lock-widgets-lab/components/ReloadEventLog';
import { SetupInstructions } from '@/modules/lock-widgets-lab/components/SetupInstructions';
import { StatusPanel } from '@/modules/lock-widgets-lab/components/StatusPanel';
import { AccessoryPreview } from '@/modules/lock-widgets-lab/components/AccessoryPreview';
import {
  DEFAULT_LOCK_CONFIG,
  type LockConfig,
  validate,
  saveShadowLockConfig,
  loadShadowLockConfig,
} from '@/modules/lock-widgets-lab/lock-config';

const LOG_CAPACITY = 10;

type LogAction = { type: 'push'; event: ReloadEvent } | { type: 'clear' };

function logReducer(state: readonly ReloadEvent[], action: LogAction): readonly ReloadEvent[] {
  switch (action.type) {
    case 'push': {
      const next = [action.event, ...state];
      return next.length > LOG_CAPACITY ? next.slice(0, LOG_CAPACITY) : next;
    }
    case 'clear':
      return [];
  }
}

function isIOS16Plus(): boolean {
  if (Platform.OS !== 'ios') return false;
  const version =
    typeof Platform.Version === 'string' ? parseFloat(Platform.Version) : Platform.Version;
  return version >= 16;
}

export default function LockWidgetsLabScreen() {
  const ios16 = isIOS16Plus();
  const [config, setConfig] = useState<LockConfig>(DEFAULT_LOCK_CONFIG);
  const [configEpoch, setConfigEpoch] = useState(0);
  const [lastPushedAt, setLastPushedAt] = useState(0);
  const [log, dispatch] = useReducer(logReducer, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (ios16 && typeof bridge.getLockConfig === 'function') {
          const c = await bridge.getLockConfig();
          if (mounted) {
            setConfig(c);
            setConfigEpoch((n) => n + 1);
          }
        } else {
          const c = await loadShadowLockConfig();
          if (mounted) {
            setConfig(c);
            setConfigEpoch((n) => n + 1);
          }
        }
      } catch {
        // Keep default
      }
    };
    load();
    return () => {
      mounted = false;
      dispatch({ type: 'clear' });
    };
  }, [ios16]);

  const handlePush = useCallback(
    async (draft: LockConfig): Promise<void> => {
      const validated = validate(draft);
      setConfig(validated);

      // Save to shadow store (for non-iOS-16+ fallback)
      await saveShadowLockConfig(validated);

      if (ios16 && typeof bridge.setLockConfig === 'function') {
        try {
          await bridge.setLockConfig(validated);
          await bridge.reloadTimelinesByKind('SpotLockScreenWidget');
          dispatch({
            type: 'push',
            event: {
              timestamp: Date.now(),
              kind: 'SpotLockScreenWidget',
              success: true,
            },
          });
          setLastPushedAt(Date.now());
        } catch (error: any) {
          dispatch({
            type: 'push',
            event: {
              timestamp: Date.now(),
              kind: 'SpotLockScreenWidget',
              success: false,
              error: error.message ?? 'Unknown error',
            },
          });
        }
      }
    },
    [ios16],
  );

  if (!ios16) {
    // Fallback layout for iOS < 16 / Android / Web
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <ThemedView style={styles.banner}>
          <ThemedText style={styles.bannerText}>
            Lock Screen Widgets are iOS 16+ only. Configuration and previews work on all platforms.
          </ThemedText>
        </ThemedView>
        <ConfigPanel key={configEpoch} value={config} onPush={handlePush} pushEnabled={false} />
        <AccessoryPreview
          showcaseValue={config.showcaseValue}
          counter={config.counter}
          tint={config.tint}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <StatusPanel version={configEpoch} lastPushedAt={lastPushedAt} />
      <ConfigPanel key={configEpoch} value={config} onPush={handlePush} pushEnabled={true} />
      <AccessoryPreview
        showcaseValue={config.showcaseValue}
        counter={config.counter}
        tint={config.tint}
      />
      <SetupInstructions />
      <ReloadEventLog entries={log} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.four,
  },
  banner: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    backgroundColor: '#FFF3CD',
  },
  bannerText: {
    fontSize: 14,
    color: '#856404',
  },
});
