/**
 * Widgets Lab — Web fallback variant.
 *
 * Same shape as `.android.tsx`. Banner copy is web-flavoured.
 *
 * @see specs/014-home-widgets/tasks.md T039
 */

import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { ConfigPanel } from '@/modules/widgets-lab/components/ConfigPanel';
import { WidgetPreview } from '@/modules/widgets-lab/components/WidgetPreview';
import {
  DEFAULT_CONFIG,
  loadShadowConfig,
  saveShadowConfig,
  type WidgetConfig,
} from '@/modules/widgets-lab/widget-config';

const BANNER_TEXT = 'Home Screen widgets require iOS 14+. The web build shows live previews only.';

export default function WidgetsLabScreen() {
  const [config, setConfig] = useState<WidgetConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    let mounted = true;
    loadShadowConfig().then((c) => {
      if (mounted) setConfig(c);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handlePush = useCallback(async (next: WidgetConfig): Promise<void> => {
    setConfig(next);
    await saveShadowConfig(next);
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ThemedView style={styles.banner}>
        <ThemedText style={styles.bannerText}>{BANNER_TEXT}</ThemedText>
      </ThemedView>
      <ThemedView style={styles.section}>
        <ConfigPanel value={config} onPush={handlePush} pushEnabled={false} />
      </ThemedView>
      <ThemedView style={styles.section}>
        <WidgetPreview config={config} />
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  section: {
    gap: Spacing.two,
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
