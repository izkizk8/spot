/**
 * RecordingRow — single row in the saved-recordings list (US2, T043).
 *
 * Renders the recording's `name`, formatted duration, humanized size, and
 * `quality` badge, plus three action buttons:
 *   - Play   → `onPlay(recording.id)`
 *   - Share  → calls `onShare(recording)` for observability, then performs the
 *              actual share via dynamic `import('expo-sharing')`. On any
 *              failure (no module, isAvailableAsync false, shareAsync throw,
 *              web platform) falls back to `Linking.openURL(uri)` (FR-014 /
 *              D-06 / R-002 — never throws).
 *   - Delete → `Alert.alert` confirm; invokes `onDelete(recording.id)` only
 *              when the user taps the destructive button (FR-013).
 */

import React from 'react';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { QualityName, Recording } from '../audio-types';
import { bytesToHuman, formatDurationMs } from '../format-utils';

export interface RecordingRowProps {
  recording: Recording;
  onPlay: (id: string) => void;
  onDelete: (id: string) => void;
  onShare: (recording: Recording) => void;
}

/**
 * Performs the platform-native share with a graceful fallback.
 *
 * The fallback chain (FR-014 / D-06 / R-002):
 *   1. `Sharing.shareAsync(uri)` if `isAvailableAsync()` returns true.
 *   2. Otherwise → `Linking.openURL(uri)`.
 *   3. Any thrown error is caught and `console.warn`-ed; never re-thrown.
 */
async function performShare(uri: string): Promise<void> {
  try {
    // Dynamic require so platforms without the module (or test environments
    // that don't `jest.mock('expo-sharing')`) don't fail at module-load time.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sharing = require('expo-sharing') as {
      isAvailableAsync: () => Promise<boolean>;
      shareAsync: (uri: string, options?: unknown) => Promise<void>;
    };
    const available = await Sharing.isAvailableAsync();
    if (available) {
      await Sharing.shareAsync(uri, { dialogTitle: 'Share recording' });
      return;
    }
  } catch (err) {
    // Fall through to Linking fallback below.
    console.warn('[audio-lab] expo-sharing failed, falling back', err);
  }
  try {
    await Linking.openURL(uri);
  } catch (err) {
    console.warn('[audio-lab] Linking.openURL fallback failed', err);
  }
}

export default function RecordingRow({
  recording,
  onPlay,
  onDelete,
  onShare,
}: RecordingRowProps) {
  const { id, name, uri, durationMs, sizeBytes, quality } = recording;
  const theme = useTheme();
  const badgeBg = qualityBackground(quality, theme);
  const badgeFg: 'background' | 'text' | 'textSecondary' =
    quality === 'High' ? 'background' : quality === 'Low' ? 'textSecondary' : 'text';

  const handlePlay = React.useCallback(() => {
    onPlay(id);
  }, [id, onPlay]);

  const handleDelete = React.useCallback(() => {
    Alert.alert(
      'Delete recording?',
      `This will permanently delete "${name}". This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => undefined },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(id),
        },
      ],
      { cancelable: true },
    );
  }, [id, name, onDelete]);

  const handleShare = React.useCallback(() => {
    onShare(recording);
    // Fire-and-forget — performShare swallows all errors per FR-014.
    void performShare(uri);
  }, [onShare, recording, uri]);

  return (
    <ThemedView
      type="backgroundElement"
      style={styles.row}
      testID={`audio-lab-row-${id}`}
    >
      <View style={styles.text}>
        <ThemedText type="smallBold">{name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {`${formatDurationMs(durationMs)} · ${bytesToHuman(sizeBytes)}`}
        </ThemedText>
      </View>

      <View
        style={[styles.badge, { backgroundColor: badgeBg }]}
        testID={`audio-lab-quality-${id}`}
      >
        <ThemedText type="small" themeColor={badgeFg}>
          {quality}
        </ThemedText>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={handlePlay}
          accessibilityRole="button"
          accessibilityLabel={`Play ${name}`}
          style={styles.action}
        >
          <ThemedText type="smallBold" themeColor="tintA">
            Play
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={handleShare}
          accessibilityRole="button"
          accessibilityLabel={`Share ${name}`}
          style={styles.action}
        >
          <ThemedText type="smallBold" themeColor="tintA">
            Share
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={handleDelete}
          accessibilityRole="button"
          accessibilityLabel={`Delete ${name}`}
          style={styles.action}
        >
          <ThemedText type="smallBold" themeColor="tintB">
            Delete
          </ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

/**
 * Maps a `QualityName` to a deterministic background color from the active
 * theme. No hardcoded hex values — every color is derived from `useTheme()`
 * tokens so light/dark mode flip cleanly (FR-011).
 *
 *   Low    → subtle  (backgroundSelected)
 *   Medium → neutral (backgroundElement — same as row, reads as "no badge")
 *   High   → strong accent (tintA)
 */
function qualityBackground(
  quality: QualityName,
  theme: ReturnType<typeof useTheme>,
): string {
  switch (quality) {
    case 'High':
      return theme.tintA;
    case 'Low':
      return theme.backgroundSelected;
    case 'Medium':
    default:
      return theme.backgroundElement;
  }
}

const styles = StyleSheet.create({
  row: {
    padding: Spacing.three,
    borderRadius: Spacing.one,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  text: {
    flex: 1,
    gap: Spacing.half,
  },
  badge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.half,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  action: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
});
