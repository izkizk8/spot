/**
 * Lock Widgets Lab — Android variant (fallback).
 *
 * Android doesn't support Lock Screen widgets. This screen shows the banner,
 * allows config editing (saved to AsyncStorage shadow), and displays previews.
 * Push button is disabled.
 *
 * @see specs/027-lock-screen-widgets/tasks.md T037, T040
 */

import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { ConfigPanel } from '@/modules/lock-widgets-lab/components/ConfigPanel';
import { AccessoryPreview } from '@/modules/lock-widgets-lab/components/AccessoryPreview';
import {
  DEFAULT_LOCK_CONFIG,
  type LockConfig,
  validate,
  saveShadowLockConfig,
  loadShadowLockConfig,
} from '@/modules/lock-widgets-lab/lock-config';

export default function LockWidgetsLabScreen() {
  const [config, setConfig] = useState<LockConfig>(DEFAULT_LOCK_CONFIG);
  const [configEpoch, setConfigEpoch] = useState(0);

  useEffect(() => {
    let mounted = true;
    loadShadowLockConfig()
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

  const handlePush = useCallback(async (draft: LockConfig): Promise<void> => {
    const validated = validate(draft);
    setConfig(validated);
    await saveShadowLockConfig(validated);
  }, []);

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
