/**
 * useSpeechSession — React hook wrapping the speech-recognition bridge (US1, T040).
 *
 * Returns { partial, final, partialWords, finalWords, isListening, error, start, stop }.
 *
 * - start({ locale, onDevice }) calls bridge.start, subscribes to partial/final/error
 * - partial event updates `partial` + `partialWords`
 * - final event appends to `final` (single-space joiner) and resets partial layer
 * - error event sets `error` and clears isListening (terminates subscriptions)
 * - stop() calls bridge.stop and unsubscribes
 * - useEffect cleanup stops + unsubscribes on unmount; mountedRef guards state updates
 *
 * Accepts optional `bridgeOverride` for tests.
 */

import React from 'react';

import defaultBridge from '@/native/speech-recognition';
import type {
  PartialEvent,
  FinalEvent,
  SpeechRecognitionError,
  SpeechBridge,
  Subscription,
  WordToken,
} from '@/native/speech-recognition.types';

export interface UseSpeechSessionOptions {
  bridgeOverride?: SpeechBridge;
}

export interface UseSpeechSessionState {
  partial: string;
  final: string;
  partialWords: WordToken[];
  finalWords: WordToken[];
  isListening: boolean;
  error: SpeechRecognitionError | null;
  start: (args: { locale: string; onDevice: boolean }) => Promise<void>;
  stop: () => Promise<void>;
  reset: () => void;
}

export function useSpeechSession(options: UseSpeechSessionOptions = {}): UseSpeechSessionState {
  const bridge = options.bridgeOverride ?? defaultBridge;

  const [partial, setPartial] = React.useState('');
  const [final, setFinal] = React.useState('');
  const [partialWords, setPartialWords] = React.useState<WordToken[]>([]);
  const [finalWords, setFinalWords] = React.useState<WordToken[]>([]);
  const [isListening, setIsListening] = React.useState(false);
  const [error, setError] = React.useState<SpeechRecognitionError | null>(null);

  const subscriptionsRef = React.useRef<Subscription[]>([]);
  const mountedRef = React.useRef(true);
  const isListeningRef = React.useRef(false);

  const safeSet = React.useCallback(<T>(setter: (v: T) => void, v: T) => {
    if (mountedRef.current) setter(v);
  }, []);

  const unsubscribe = React.useCallback(() => {
    for (const sub of subscriptionsRef.current) {
      try {
        sub.remove();
      } catch {
        // ignore
      }
    }
    subscriptionsRef.current = [];
  }, []);

  const stop = React.useCallback(async () => {
    try {
      await bridge.stop();
    } catch {
      // swallow — terminal state already
    }
    unsubscribe();
    isListeningRef.current = false;
    safeSet(setIsListening, false);
  }, [bridge, unsubscribe, safeSet]);

  const start = React.useCallback(
    async (args: { locale: string; onDevice: boolean }) => {
      // Reset error from any prior terminal state.
      safeSet(setError, null);

      // If already listening, don't double-subscribe.
      if (isListeningRef.current) {
        unsubscribe();
      }

      await bridge.start(args);

      const partialSub = bridge.events.addListener('partial', (event: PartialEvent) => {
        if (!mountedRef.current) return;
        setPartial(event.transcript ?? '');
        setPartialWords(event.words ?? []);
      });
      const finalSub = bridge.events.addListener('final', (event: FinalEvent) => {
        if (!mountedRef.current) return;
        setFinal((prev) =>
          prev ? `${prev} ${event.transcript}` : event.transcript,
        );
        setFinalWords((prev) => (event.words ? [...prev, ...event.words] : prev));
        setPartial('');
        setPartialWords([]);
      });
      const errorSub = bridge.events.addListener('error', (event: SpeechRecognitionError) => {
        if (!mountedRef.current) return;
        setError(event);
        setIsListening(false);
        isListeningRef.current = false;
        unsubscribe();
      });

      subscriptionsRef.current = [partialSub, finalSub, errorSub];
      isListeningRef.current = true;
      safeSet(setIsListening, true);
    },
    [bridge, unsubscribe, safeSet],
  );

  const reset = React.useCallback(() => {
    setPartial('');
    setFinal('');
    setPartialWords([]);
    setFinalWords([]);
  }, []);

  React.useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (isListeningRef.current) {
        // Fire-and-forget; we've already flipped the mounted guard.
        void bridge.stop().catch(() => {});
      }
      // Unsubscribe regardless.
      for (const sub of subscriptionsRef.current) {
        try {
          sub.remove();
        } catch {
          // ignore
        }
      }
      subscriptionsRef.current = [];
    };
  }, [bridge]);

  return {
    partial,
    final,
    partialWords,
    finalWords,
    isListening,
    error,
    start,
    stop,
    reset,
  };
}
