/**
 * Audio Lab — iOS screen (US1, T038).
 *
 * Mounts `useAudioRecorder`, calls `recordings-store.loadRecordings()` once on
 * mount, and composes:
 *   - PermissionBanner (visible only when permission denied)
 *   - RecorderCard (record button + elapsed time + meter + quality selector)
 *   - RecordingsList (saved recordings)
 *   - AudioSessionCard placeholder (full impl lands in US4)
 *
 * Player + Share + Delete callbacks are wired in US2 / T038-followup; for US1
 * they are no-ops at the screen level so the empty state and the
 * record-stop-then-row-appears flow are exercised end-to-end.
 */

import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { Recording } from './audio-types';
import PermissionBanner from './components/PermissionBanner';
import RecorderCard from './components/RecorderCard';
import RecordingsList from './components/RecordingsList';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import {
  deleteRecording as defaultDeleteRecording,
  loadRecordings as defaultLoadRecordings,
} from './recordings-store';

export interface AudioLabScreenProps {
  /** Test seam for the recordings store. */
  loadRecordingsOverride?: () => Promise<Recording[]>;
  /** Test seam for the recordings store. */
  deleteRecordingOverride?: (id: string) => Promise<Recording[]>;
}

export default function AudioLabScreen({
  loadRecordingsOverride,
  deleteRecordingOverride,
}: AudioLabScreenProps = {}) {
  const recorder = useAudioRecorder();
  const player = useAudioPlayer();
  const [recordings, setRecordings] = React.useState<Recording[]>([]);
  const recordingsRef = React.useRef<Recording[]>([]);
  recordingsRef.current = recordings;
  const mountedRef = React.useRef(true);

  React.useEffect(() => {
    mountedRef.current = true;
    const load = loadRecordingsOverride ?? defaultLoadRecordings;
    load().then(
      (list) => {
        if (mountedRef.current) {
          // Newest-first display order (createdAt desc).
          const sorted = [...list].toSorted((a, b) =>
            a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0,
          );
          setRecordings(sorted);
        }
      },
      (err) => {
        console.warn('[audio-lab] loadRecordings failed', err);
      },
    );
    return () => {
      mountedRef.current = false;
    };
  }, [loadRecordingsOverride]);

  const handleStart = React.useCallback(() => {
    recorder.start().catch((err) => {
      // Permission denial / unavailable — surface via banner state, do not
      // throw uncaught.
      console.warn('[audio-lab] start failed', err);
    });
  }, [recorder]);

  const handleStop = React.useCallback(() => {
    recorder
      .stop()
      .then((rec) => {
        if (!mountedRef.current) return;
        setRecordings((prev) => [rec, ...prev]);
      })
      .catch((err) => {
        console.warn('[audio-lab] stop failed', err);
      });
  }, [recorder]);

  const handleRequestPermission = React.useCallback(() => {
    recorder.requestPermission().catch(() => undefined);
  }, [recorder]);

  const handlePlay = React.useCallback(
    (id: string) => {
      const target = recordingsRef.current.find((r) => r.id === id);
      if (!target) return;
      player.play(target.uri).catch((err) => {
        // File-missing / load-failed errors are surfaced via player.status;
        // log so dev builds see why playback didn't start.
        console.warn('[audio-lab] play failed', err);
      });
    },
    [player],
  );

  const handleDelete = React.useCallback(
    (id: string) => {
      // If the deleted row is currently playing, stop the player first so we
      // don't leave a dangling handle pointed at a deleted file.
      if (player.currentUri) {
        const target = recordingsRef.current.find((r) => r.id === id);
        if (target && target.uri === player.currentUri) {
          player.stop().catch(() => undefined);
        }
      }
      const del = deleteRecordingOverride ?? defaultDeleteRecording;
      del(id).then(
        (next) => {
          if (mountedRef.current) {
            const sorted = [...next].toSorted((a, b) =>
              a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0,
            );
            setRecordings(sorted);
          }
        },
        (err) => {
          console.warn('[audio-lab] deleteRecording failed', err);
        },
      );
    },
    [deleteRecordingOverride, player],
  );

  // RecordingRow owns the actual share path (expo-sharing → Linking
  // fallback). The screen-level handler is observability-only.
  const handleShare = React.useCallback((_r: Recording) => undefined, []);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <PermissionBanner
          status={recorder.hasPermission}
          onRequestPermission={handleRequestPermission}
        />

        <RecorderCard
          status={recorder.status}
          elapsedMs={recorder.elapsedMs}
          meterLevel={recorder.meterLevel}
          quality={recorder.quality}
          onStart={handleStart}
          onStop={handleStop}
          onChangeQuality={recorder.setQuality}
        />

        <RecordingsList
          recordings={recordings}
          onPlay={handlePlay}
          onDelete={handleDelete}
          onShare={handleShare}
        />

        <ThemedView
          type="backgroundElement"
          style={styles.sessionCard}
          testID="audio-lab-session-card"
        >
          <ThemedText type="smallBold">Audio Session</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            iOS audio session category controls land in US4.
          </ThemedText>
        </ThemedView>
      </ScrollView>
    </ThemedView>
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
  sessionCard: {
    padding: Spacing.three,
    borderRadius: Spacing.one,
    gap: Spacing.one,
  },
});
