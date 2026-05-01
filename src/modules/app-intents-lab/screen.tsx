/**
 * iOS variant of the App Intents Lab screen.
 *
 * Renders the self-test panel (mood picker + Log/Get/Greet),
 * a result line, the in-memory event log (cap 10), the shared
 * Mood History (last 20), and the Shortcuts integration card.
 *
 * No "iOS 16+ only" banner — this variant only mounts on iOS.
 *
 * @see specs/013-app-intents/data-model.md
 */

import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { AppState, Linking, Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import bridge from '@/native/app-intents';
import { GreetForm } from '@/modules/app-intents-lab/components/GreetForm';
import { IntentEventLog } from '@/modules/app-intents-lab/components/IntentEventLog';
import { MoodHistory } from '@/modules/app-intents-lab/components/MoodHistory';
import { MoodLogger } from '@/modules/app-intents-lab/components/MoodLogger';
import { ShortcutsGuideCard } from '@/modules/app-intents-lab/components/ShortcutsGuideCard';
import {
  EMPTY_LOG,
  eventLogReducer,
  type IntentInvocation,
  type IntentName,
} from '@/modules/app-intents-lab/event-log';
import {
  DEFAULT_MOOD,
  list as listMoods,
  push as pushMood,
  type Mood,
  type MoodRecord,
} from '@/modules/app-intents-lab/mood-store';

const HISTORY_LIMIT = 20;

let invocationCounter = 0;
function nextInvocationId(): string {
  invocationCounter += 1;
  return `inv-${invocationCounter}-${Date.now()}`;
}

function makeInvocation(
  intentName: IntentName,
  parameters: Readonly<Record<string, unknown>> | undefined,
  result: string,
  status: 'success' | 'failure',
): IntentInvocation {
  return {
    id: nextInvocationId(),
    timestamp: Date.now(),
    intentName,
    parameters,
    result,
    status,
  };
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

export default function AppIntentsLabScreen() {
  const [mood, setMood] = useState<Mood>(DEFAULT_MOOD);
  const [name, setName] = useState<string>('');
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [history, setHistory] = useState<readonly MoodRecord[]>([]);
  const [log, dispatch] = useReducer(eventLogReducer, EMPTY_LOG);

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

  const onLogMood = useCallback(async (): Promise<void> => {
    const timestamp = Date.now();
    let bridgeError: string | null = null;
    try {
      const r = await bridge.logMood(mood);
      const result = `Logged ${r.logged} at ${formatTime(r.timestamp)}`;
      setLastResult(result);
      dispatch({
        type: 'append',
        invocation: makeInvocation('LogMoodIntent', { mood }, result, 'success'),
      });
    } catch (e) {
      bridgeError = e instanceof Error ? e.message : String(e);
      setLastResult(bridgeError);
      dispatch({
        type: 'append',
        invocation: makeInvocation('LogMoodIntent', { mood }, bridgeError, 'failure'),
      });
    }
    // Always push through the JS store so the history reflects the
    // entry even when the bridge is mocked (tests) or unavailable.
    try {
      await pushMood({ mood, timestamp });
      await refreshHistory();
    } catch {
      // Refresh failures are non-fatal — the next AppState foreground will retry.
    }
  }, [mood, refreshHistory]);

  const onGetLastMood = useCallback(async (): Promise<void> => {
    try {
      const r = await bridge.getLastMood();
      const result = r.mood == null ? 'Last mood: none' : `Last mood: ${r.mood}`;
      setLastResult(result);
      dispatch({
        type: 'append',
        invocation: makeInvocation('GetLastMoodIntent', undefined, result, 'success'),
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setLastResult(message);
      dispatch({
        type: 'append',
        invocation: makeInvocation('GetLastMoodIntent', undefined, message, 'failure'),
      });
    }
  }, []);

  const onGreetUser = useCallback(async (trimmedName: string): Promise<void> => {
    try {
      const r = await bridge.greetUser(trimmedName);
      setLastResult(r.greeting);
      dispatch({
        type: 'append',
        invocation: makeInvocation('GreetUserIntent', { name: trimmedName }, r.greeting, 'success'),
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setLastResult(message);
      dispatch({
        type: 'append',
        invocation: makeInvocation('GreetUserIntent', { name: trimmedName }, message, 'failure'),
      });
    }
  }, []);

  const openShortcuts = useCallback(async (): Promise<void> => {
    try {
      await Linking.openURL('shortcuts://');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to open Shortcuts';
      setLastResult(message);
    }
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ThemedView style={styles.section}>
        <MoodLogger value={mood} onChange={setMood} onLog={onLogMood} />
        <Pressable
          accessibilityRole='button'
          accessibilityLabel='Get last mood'
          onPress={onGetLastMood}
          style={styles.secondaryButton}
        >
          <ThemedText style={styles.secondaryButtonText}>Get last mood</ThemedText>
        </Pressable>
        <GreetForm value={name} onChange={setName} onGreet={onGreetUser} />
        {lastResult != null && (
          <ThemedText style={styles.resultLine} accessibilityLabel={`Result: ${lastResult}`}>
            {lastResult}
          </ThemedText>
        )}
      </ThemedView>

      <ThemedView style={styles.section}>
        <IntentEventLog log={log} />
      </ThemedView>

      <ThemedView style={styles.section}>
        <MoodHistory history={history.slice(0, HISTORY_LIMIT)} />
      </ThemedView>

      <ThemedView style={styles.section}>
        <ShortcutsGuideCard onOpenShortcuts={openShortcuts} />
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
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.two,
  },
  secondaryButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.one,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  resultLine: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});
