/**
 * Android / Web fallback variant of the App Intents Lab screen.
 *
 * Renders an "iOS 16+ only" banner + JS Mood Logger + inline Greet
 * form + the same Mood History list. Does NOT render the iOS-only
 * IntentEventLog, Get last mood button, or Shortcuts integration card.
 *
 * Does NOT import @/native/app-intents (FR-031).
 *
 * @see specs/013-app-intents/data-model.md
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { GreetForm } from '@/modules/app-intents-lab/components/GreetForm';
import { MoodHistory } from '@/modules/app-intents-lab/components/MoodHistory';
import { MoodLogger } from '@/modules/app-intents-lab/components/MoodLogger';
import {
  DEFAULT_MOOD,
  list as listMoods,
  push as pushMood,
  type Mood,
  type MoodRecord,
} from '@/modules/app-intents-lab/mood-store';

const HISTORY_LIMIT = 20;
const BANNER_TEXT = 'App Intents are iOS 16+ only';

export default function AppIntentsLabScreen() {
  const [mood, setMood] = useState<Mood>(DEFAULT_MOOD);
  const [name, setName] = useState<string>('');
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [history, setHistory] = useState<readonly MoodRecord[]>([]);

  const mountedRef = useRef<boolean>(true);

  const refreshHistory = useCallback(async (): Promise<void> => {
    const fresh = await listMoods({ limit: HISTORY_LIMIT });
    if (mountedRef.current) {
      setHistory(fresh);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void refreshHistory();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') {
        void refreshHistory();
      }
    });
    return () => {
      mountedRef.current = false;
      sub.remove();
    };
  }, [refreshHistory]);

  const onLogMoodJS = useCallback(async (): Promise<void> => {
    try {
      await pushMood({ mood, timestamp: Date.now() });
      await refreshHistory();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setLastResult(message);
    }
  }, [mood, refreshHistory]);

  const onGreetUserJS = useCallback((trimmedName: string): void => {
    setLastResult(`Hello, ${trimmedName}!`);
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ThemedView style={styles.banner}>
        <ThemedText style={styles.bannerText}>{BANNER_TEXT}</ThemedText>
      </ThemedView>

      <ThemedView style={styles.section}>
        <MoodLogger value={mood} onChange={setMood} onLog={onLogMoodJS} />
        <GreetForm value={name} onChange={setName} onGreet={onGreetUserJS} />
        {lastResult != null && (
          <ThemedText style={styles.resultLine} accessibilityLabel={`Result: ${lastResult}`}>
            {lastResult}
          </ThemedText>
        )}
      </ThemedView>

      <ThemedView style={styles.section}>
        <MoodHistory history={history.slice(0, HISTORY_LIMIT)} />
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
  banner: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    backgroundColor: '#FFF3CD',
  },
  bannerText: {
    fontSize: 14,
    color: '#856404',
  },
  section: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.two,
  },
  resultLine: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});
