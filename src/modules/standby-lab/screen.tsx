/**
 * StandBy Lab — iOS 17+ variant.
 *
 * Orchestrates ExplainerCard + StandByConfigPanel + StandByPreview +
 * SetupInstructions + ReloadEventLog (FR-SB-026 order).
 *
 * Reads/writes standby config via the WidgetCenter bridge (App Group on iOS 17+).
 * Falls back to the same fallback layout as android/web on iOS < 17 (FR-SB-046).
 *
 * @see specs/028-standby-mode/tasks.md T036, T039
 */

import React, { useCallback, useEffect, useReducer, useState } from 'react';
import { Platform, ScrollView, StyleSheet } from 'react-native';

import { Spacing } from '@/constants/theme';
import bridge from '@/native/widget-center';
import { ExplainerCard } from '@/modules/standby-lab/components/ExplainerCard';
import { IOSOnlyBanner } from '@/modules/standby-lab/components/IOSOnlyBanner';
import { ReloadEventLog, type ReloadEvent } from '@/modules/standby-lab/components/ReloadEventLog';
import { SetupInstructions } from '@/modules/standby-lab/components/SetupInstructions';
import { StandByConfigPanel } from '@/modules/standby-lab/components/StandByConfigPanel';
import { StandByPreview } from '@/modules/standby-lab/components/StandByPreview';
import {
  DEFAULT_STANDBY_CONFIG,
  loadShadowStandByConfig,
  saveShadowStandByConfig,
  validate,
  type StandByConfig,
} from '@/modules/standby-lab/standby-config';

const LOG_CAPACITY = 10;
const STANDBY_KIND = 'SpotStandByWidget';

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

function isIOS17Plus(): boolean {
  if (Platform.OS !== 'ios') return false;
  const version =
    typeof Platform.Version === 'string' ? parseFloat(Platform.Version) : Platform.Version;
  return version >= 17;
}

export default function StandByLabScreen() {
  const ios17 = isIOS17Plus();
  const [config, setConfig] = useState<StandByConfig>(DEFAULT_STANDBY_CONFIG);
  const [configEpoch, setConfigEpoch] = useState(0);
  const [log, dispatch] = useReducer(logReducer, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (ios17 && typeof bridge.getStandByConfig === 'function') {
          const c = await bridge.getStandByConfig();
          if (mounted) {
            setConfig(c);
            setConfigEpoch((n) => n + 1);
          }
        } else {
          const c = await loadShadowStandByConfig();
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
  }, [ios17]);

  const handlePush = useCallback(
    async (draft: StandByConfig): Promise<void> => {
      const validated = validate(draft);
      setConfig(validated);
      await saveShadowStandByConfig(validated);

      if (!ios17 || typeof bridge.setStandByConfig !== 'function') {
        return;
      }
      try {
        await bridge.setStandByConfig(validated);
        await bridge.reloadTimelinesByKind(STANDBY_KIND);
        dispatch({
          type: 'push',
          event: { timestamp: Date.now(), kind: STANDBY_KIND, success: true },
        });
      } catch (error: any) {
        dispatch({
          type: 'push',
          event: {
            timestamp: Date.now(),
            kind: STANDBY_KIND,
            success: false,
            error: error?.message ?? 'Unknown error',
          },
        });
      }
    },
    [ios17],
  );

  const handleDraftChange = useCallback((draft: StandByConfig) => {
    setConfig(draft);
    void saveShadowStandByConfig(draft);
  }, []);

  if (!ios17) {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <IOSOnlyBanner />
        <ExplainerCard />
        <StandByConfigPanel
          key={configEpoch}
          value={config}
          onPush={handlePush}
          pushEnabled={false}
          disabledPushReason='StandBy push requires iOS 17+. Edits persist locally.'
          onChange={handleDraftChange}
        />
        <StandByPreview
          showcaseValue={config.showcaseValue}
          counter={config.counter}
          tint={config.tint}
          mode={config.mode}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <ExplainerCard />
      <StandByConfigPanel
        key={configEpoch}
        value={config}
        onPush={handlePush}
        pushEnabled={true}
        onChange={handleDraftChange}
      />
      <StandByPreview
        showcaseValue={config.showcaseValue}
        counter={config.counter}
        tint={config.tint}
        mode={config.mode}
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
});
