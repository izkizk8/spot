/**
 * StandBy Lab — Web variant (fallback).
 *
 * Web does not support StandBy. Shows the banner, explainer, and an
 * interactive preview. Edits persist to AsyncStorage shadow store.
 *
 * @see specs/028-standby-mode/tasks.md T038, T041
 */

import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { Spacing } from '@/constants/theme';
import { ExplainerCard } from '@/modules/standby-lab/components/ExplainerCard';
import { IOSOnlyBanner } from '@/modules/standby-lab/components/IOSOnlyBanner';
import { StandByConfigPanel } from '@/modules/standby-lab/components/StandByConfigPanel';
import { StandByPreview } from '@/modules/standby-lab/components/StandByPreview';
import {
  DEFAULT_STANDBY_CONFIG,
  loadShadowStandByConfig,
  saveShadowStandByConfig,
  validate,
  type StandByConfig,
} from '@/modules/standby-lab/standby-config';

export default function StandByLabScreen() {
  const [config, setConfig] = useState<StandByConfig>(DEFAULT_STANDBY_CONFIG);
  const [configEpoch, setConfigEpoch] = useState(0);

  useEffect(() => {
    let mounted = true;
    loadShadowStandByConfig()
      .then((c) => {
        if (mounted) {
          setConfig(c);
          setConfigEpoch((n) => n + 1);
        }
      })
      .catch(() => {
        // Keep default
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handlePush = useCallback(async (draft: StandByConfig): Promise<void> => {
    const validated = validate(draft);
    setConfig(validated);
    await saveShadowStandByConfig(validated);
  }, []);

  const handleDraftChange = useCallback((draft: StandByConfig) => {
    setConfig(draft);
    void saveShadowStandByConfig(draft);
  }, []);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <IOSOnlyBanner />
      <ExplainerCard />
      <StandByConfigPanel
        key={configEpoch}
        value={config}
        onPush={handlePush}
        pushEnabled={false}
        disabledPushReason="StandBy push requires iOS 17+. Edits persist locally."
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

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.four,
  },
});
