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
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { loadRecordings as defaultLoadRecordings } from './recordings-store';

export interface AudioLabScreenProps {
  /** Test seam for the recordings store. */
  loadRecordingsOverride?: () => Promise<Recording[]>;
}

export default function AudioLabScreen({ loadRecordingsOverride }: AudioLabScreenProps = {}) {
  const recorder = useAudioRecorder();
  const [recordings, setRecordings] = React.useState<Recording[]>([]);
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

  // Player / share / delete are wired in US2.
  const noopId = React.useCallback((_id: string) => undefined, []);
  const noopShare = React.useCallback((_r: Recording) => undefined, []);

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
          onPlay={noopId}
          onDelete={noopId}
          onShare={noopShare}
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
