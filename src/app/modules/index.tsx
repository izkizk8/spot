import { SymbolView } from 'expo-symbols';
import { Link } from 'expo-router';
import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { MODULES } from '@/modules/registry';
import type { ModuleManifest, ModulePlatform } from '@/modules/types';

const CURRENT_PLATFORM: ModulePlatform | null =
  Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : Platform.OS === 'web' ? 'web' : null;

function isAvailable(manifest: ModuleManifest): boolean {
  if (CURRENT_PLATFORM == null) return false;
  return manifest.platforms.includes(CURRENT_PLATFORM);
}

function platformBadge(manifest: ModuleManifest): string | null {
  if (isAvailable(manifest)) {
    if (CURRENT_PLATFORM === 'ios' && manifest.minIOS) return `iOS ${manifest.minIOS}+`;
    return null;
  }
  // Unsupported on this platform.
  if (manifest.platforms.length === 1 && manifest.platforms[0] === 'ios') return 'iOS only';
  return `${manifest.platforms.join(' / ')} only`;
}

function EmptyState() {
  const theme = useTheme();
  return (
    <ThemedView style={styles.emptyContainer}>
      <SymbolView
        name="square.grid.2x2"
        size={64}
        tintColor={theme.textSecondary}
        fallback={<ThemedText type="title">▦</ThemedText>}
      />
      <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
        No modules registered yet. Add one in src/modules/ to see it here.
      </ThemedText>
    </ThemedView>
  );
}

function ModuleCard({ manifest }: { manifest: ModuleManifest }) {
  const theme = useTheme();
  const available = isAvailable(manifest);
  const badge = platformBadge(manifest);

  const card = (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedView style={styles.cardHeader} type="backgroundElement">
        <SymbolView
          name={manifest.icon.ios as never}
          size={28}
          tintColor={theme.text}
          fallback={<ThemedText type="subtitle">{manifest.icon.fallback}</ThemedText>}
        />
        {badge != null && (
          <ThemedView type="backgroundSelected" style={styles.badge}>
            <ThemedText type="small" themeColor="textSecondary">
              {badge}
            </ThemedText>
          </ThemedView>
        )}
      </ThemedView>
      <ThemedText type="smallBold">{manifest.title}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {manifest.description}
      </ThemedText>
    </ThemedView>
  );

  return (
    <Link href={{ pathname: '/modules/[id]', params: { id: manifest.id } }} asChild>
      <Pressable style={({ pressed }) => [styles.cardPressable, pressed && styles.pressed]}>
        {available ? card : <ThemedView style={styles.unavailableWrap}>{card}</ThemedView>}
      </Pressable>
    </Link>
  );
}

export default function ModulesScreen() {
  const insets = useSafeAreaInsets();
  const contentInset = {
    top: insets.top,
    bottom: insets.bottom + BottomTabInset + Spacing.three,
    left: insets.left,
    right: insets.right,
  };
  const theme = useTheme();

  return (
    <ThemedView style={styles.root}>
      <ScrollView
        style={[styles.scroll, { backgroundColor: theme.background }]}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + Spacing.four,
            paddingBottom: contentInset.bottom,
          },
        ]}
      >
        <ThemedView style={styles.header}>
          <ThemedText type="subtitle">Modules</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            A library of self-contained iOS feature demos.
          </ThemedText>
        </ThemedView>

        {MODULES.length === 0 ? (
          <EmptyState />
        ) : (
          <ThemedView style={styles.grid}>
            {MODULES.map((manifest) => (
              <ModuleCard key={manifest.id} manifest={manifest} />
            ))}
          </ThemedView>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    gap: Spacing.two,
    paddingTop: Spacing.three,
  },
  grid: {
    gap: Spacing.three,
  },
  cardPressable: {
    borderRadius: Spacing.four,
  },
  card: {
    gap: Spacing.two,
    padding: Spacing.four,
    borderRadius: Spacing.four,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.three,
  },
  unavailableWrap: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.7,
  },
  emptyContainer: {
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.six,
  },
  emptyText: {
    textAlign: 'center',
    paddingHorizontal: Spacing.four,
  },
});
