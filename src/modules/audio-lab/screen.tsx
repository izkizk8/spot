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

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { AudioSessionCategory, QualityName, Recording } from './audio-types';
import { applyCategory as defaultApplyCategory } from './audio-session';
import AudioSessionCard from './components/AudioSessionCard';
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
  /** Test seam for `audio-session.applyCategory`. */
  applyCategoryOverride?: (cat: AudioSessionCategory) => Promise<void>;
}

export default function AudioLabScreen({
  loadRecordingsOverride,
  deleteRecordingOverride,
  applyCategoryOverride,
}: AudioLabScreenProps = {}) {
  const recorder = useAudioRecorder();
  const player = useAudioPlayer();
  const [recordings, setRecordings] = React.useState<Recording[]>([]);
  // FR-007 / D-03: quality state lives at the screen level so that the
  // selection survives `RecorderCard` re-renders and remains the single source
  // of truth handed back into the recorder hook.
  const [quality, setQualityState] = React.useState<QualityName>('Medium');
  // FR-020 / US4: audio session category — Playback is the most common
  // default and matches the implicit category at module mount.
  const [selectedCategory, setSelectedCategory] = React.useState<AudioSessionCategory>('Playback');
  const [activeCategory, setActiveCategory] = React.useState<AudioSessionCategory>('Playback');
  const recordingsRef = React.useRef<Recording[]>([]);
  React.useEffect(() => {
    recordingsRef.current = recordings;
  }, [recordings]);
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

  const handleChangeQuality = React.useCallback(
    (q: QualityName) => {
      // recorder.setQuality is itself a no-op while recording (FR-008); the
      // screen mirrors that guard so the visible selection cannot diverge
      // from the recorder's working preset mid-capture.
      if (recorder.status === 'recording' || recorder.status === 'stopping') return;
      setQualityState(q);
      recorder.setQuality(q);
    },
    [recorder],
  );

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

  const handleApplyCategory = React.useCallback(
    async (cat: AudioSessionCategory) => {
      const apply = applyCategoryOverride ?? defaultApplyCategory;
      try {
        await apply(cat);
        if (mountedRef.current) setActiveCategory(cat);
      } catch (err) {
        // Per FR-020 the failure path is non-fatal: leave activeCategory
        // unchanged so the pill reflects what's actually live on the OS.
        console.warn('[audio-lab] applyCategory failed', err);
      }
    },
    [applyCategoryOverride],
  );

  const handleStopRecorder = React.useCallback(async () => {
    try {
      const rec = await recorder.stop();
      if (mountedRef.current && rec) {
        setRecordings((prev) => [rec, ...prev]);
      }
    } catch (err) {
      console.warn('[audio-lab] stop (pre-apply) failed', err);
    }
  }, [recorder]);

  const handleStopPlayer = React.useCallback(async () => {
    try {
      await player.stop();
    } catch (err) {
      console.warn('[audio-lab] player.stop (pre-apply) failed', err);
    }
  }, [player]);

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
          quality={quality}
          onStart={handleStart}
          onStop={handleStop}
          onChangeQuality={handleChangeQuality}
        />

        <RecordingsList
          recordings={recordings}
          onPlay={handlePlay}
          onDelete={handleDelete}
          onShare={handleShare}
        />

        <AudioSessionCard
          selected={selectedCategory}
          activeCategory={activeCategory}
          recorderStatus={recorder.status}
          playerStatus={player.status}
          onSelect={setSelectedCategory}
          onApply={handleApplyCategory}
          onStopRecorder={handleStopRecorder}
          onStopPlayer={handleStopPlayer}
        />
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
});
