/**
 * AudioSessionCard — iOS audio session category picker (US4, T053).
 *
 * Renders a 5-segment picker for the supported `AudioSessionCategory` values
 * plus an Apply button that:
 *   1. Awaits `onStopRecorder()` if the recorder is currently `recording`
 *      (FR-024 / D-09).
 *   2. Awaits `onStopPlayer()` if the player is currently `playing`,
 *      `paused`, or `loading` (FR-025).
 *   3. Invokes `onApply(selected)` so the screen can call
 *      `audio-session.applyCategory`.
 *
 * On `Platform.OS === 'web'`, the Apply button is replaced by an
 * informational tooltip and `onApply` is never invoked — `expo-audio`'s web
 * backend has no audio-session surface (FR-045 / R-007).
 *
 * Pure UI: state lives on the screen; this component is fully controlled.
 */

import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type {
  AudioSessionCategory,
  PlayerState,
  RecorderState,
} from '../audio-types';

const CATEGORIES: ReadonlyArray<AudioSessionCategory> = [
  'Playback',
  'Record',
  'PlayAndRecord',
  'Ambient',
  'SoloAmbient',
];

export interface AudioSessionCardProps {
  selected: AudioSessionCategory;
  activeCategory: AudioSessionCategory;
  recorderStatus: RecorderState;
  playerStatus: PlayerState;
  onSelect: (category: AudioSessionCategory) => void;
  onApply: (category: AudioSessionCategory) => void | Promise<void>;
  /** Called before `onApply` when `recorderStatus === 'recording'`. */
  onStopRecorder: () => Promise<unknown> | void;
  /** Called before `onApply` when the player is loading/playing/paused. */
  onStopPlayer: () => Promise<unknown> | void;
}

function isPlayerActive(status: PlayerState): boolean {
  // FR-025: any non-terminal state means the player owns the audio session
  // and must release it before we change category.
  return status === 'playing' || status === 'paused' || status === 'loading';
}

export default function AudioSessionCard({
  selected,
  activeCategory,
  recorderStatus,
  playerStatus,
  onSelect,
  onApply,
  onStopRecorder,
  onStopPlayer,
}: AudioSessionCardProps) {
  const theme = useTheme();
  const [applying, setApplying] = React.useState(false);
  // Read Platform.OS at render-time so test mocks via Object.defineProperty
  // are honored on every render.
  const isWeb = Platform.OS === 'web';

  const handleApply = React.useCallback(async () => {
    if (isWeb || applying) return;
    setApplying(true);
    try {
      // Order matters: stop the recorder first (it holds the input route),
      // then stop the player (output route), then apply the new category.
      if (recorderStatus === 'recording') {
        try {
          await onStopRecorder();
        } catch (err) {
          // Surfaced upstream via recorder hook status; don't block apply.
          console.warn('[AudioSessionCard] onStopRecorder failed', err);
        }
      }
      if (isPlayerActive(playerStatus)) {
        try {
          await onStopPlayer();
        } catch (err) {
          console.warn('[AudioSessionCard] onStopPlayer failed', err);
        }
      }
      await onApply(selected);
    } finally {
      setApplying(false);
    }
  }, [
    isWeb,
    applying,
    recorderStatus,
    playerStatus,
    onStopRecorder,
    onStopPlayer,
    onApply,
    selected,
  ]);

  return (
    <ThemedView
      type="backgroundElement"
      style={styles.card}
      testID="audio-lab-session-card"
    >
      <View style={styles.header}>
        <ThemedText type="smallBold">Audio Session</ThemedText>
        <View
          style={[styles.pill, { backgroundColor: theme.backgroundSelected }]}
          testID="audio-session-active-pill"
          accessibilityRole="text"
          accessibilityLabel={`Active category: ${activeCategory}`}
        >
          <ThemedText type="smallBold" themeColor="tintA">
            {activeCategory}
          </ThemedText>
        </View>
      </View>

      <View style={styles.segmentRow} accessibilityLabel="Audio session category">
        {CATEGORIES.map((cat) => {
          const isSelected = cat === selected;
          return (
            <Pressable
              key={cat}
              onPress={() => onSelect(cat)}
              accessibilityRole="button"
              accessibilityLabel={`Category: ${cat}`}
              accessibilityState={{ selected: isSelected }}
              style={[
                styles.segment,
                isSelected && { backgroundColor: theme.backgroundSelected },
              ]}
            >
              <ThemedText
                type="small"
                themeColor={isSelected ? 'tintA' : 'text'}
              >
                {cat}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      {isWeb ? (
        <ThemedText
          type="small"
          themeColor="textSecondary"
          testID="audio-session-web-tooltip"
        >
          Audio session control is not available on web.
        </ThemedText>
      ) : (
        <Pressable
          onPress={() => {
            void handleApply();
          }}
          disabled={applying}
          accessibilityRole="button"
          accessibilityLabel="Apply audio session category"
          accessibilityState={{ disabled: applying, busy: applying }}
          style={[
            styles.applyButton,
            { backgroundColor: theme.tintA },
            applying && styles.disabled,
          ]}
          testID="audio-session-apply-button"
        >
          <ThemedText type="smallBold" themeColor="background">
            Apply
          </ThemedText>
        </Pressable>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.one,
    gap: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pill: {
    paddingVertical: Spacing.one / 2,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.three,
  },
  segmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  segment: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.one,
  },
  applyButton: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.one,
    marginTop: Spacing.one,
  },
  disabled: {
    opacity: 0.4,
  },
});
