/**
 * useSynthesisSession — React hook owning the speech-synthesis transport state.
 *
 * Returns { status, currentWordRange, voices, selectedVoiceId,
 *           personalVoiceStatus, pauseSupported, selectVoice, speak, pause,
 *           continue, stop, requestPersonalVoice }.
 *
 * Lifecycle:
 *   - on mount: enumerate voices (`bridge.availableVoices()`); seed
 *     personalVoiceStatus by calling `bridge.requestPersonalVoiceAuthorization()`
 *     ONLY when iOS 17+ is detected (otherwise 'unsupported' synchronously);
 *     probe pause support by calling `bridge.pause()` and treating
 *     `SpeechSynthesisPauseUnsupported` as `pauseSupported = false`, then
 *     immediately stop().
 *   - subscribes to all six event channels lazily on first speak() call.
 *   - on unmount: stop() if not idle, unsubscribe.
 */

import React from 'react';
import { Platform } from 'react-native';

import defaultBridge from '@/native/speech-synthesis';
import type {
  PersonalVoiceAuthorizationStatus,
  SpeakArgs,
  SpeechBridgeSubscription,
  SpeechSynthesisBridge,
  SynthEventName,
  SynthEventPayloads,
  TransportState,
  Voice,
  WordBoundaryEvent,
} from '@/native/speech-synthesis.types';
import { SpeechSynthesisPauseUnsupported } from '@/native/speech-synthesis.types';

export interface UseSynthesisSessionOptions {
  bridgeOverride?: SpeechSynthesisBridge;
}

export interface UseSynthesisSessionState {
  status: TransportState;
  currentWordRange: { location: number; length: number } | null;
  voices: Voice[];
  selectedVoiceId: string | undefined;
  personalVoiceStatus: PersonalVoiceAuthorizationStatus;
  pauseSupported: boolean;
  selectVoice: (id: string | undefined) => void;
  speak: (args: SpeakArgs) => Promise<void>;
  pause: () => Promise<void>;
  continue: () => Promise<void>;
  stop: () => Promise<void>;
  requestPersonalVoice: () => Promise<PersonalVoiceAuthorizationStatus>;
}

function isIOS17Plus(): boolean {
  if (Platform.OS !== 'ios') return false;
  const v = Platform.Version;
  if (typeof v === 'number') return v >= 17;
  if (typeof v === 'string') {
    const n = Number.parseFloat(v);
    return Number.isFinite(n) && n >= 17;
  }
  return false;
}

export function useSynthesisSession(
  options: UseSynthesisSessionOptions = {},
): UseSynthesisSessionState {
  const bridge = options.bridgeOverride ?? defaultBridge;

  const [status, setStatus] = React.useState<TransportState>('idle');
  const [currentWordRange, setCurrentWordRange] = React.useState<
    { location: number; length: number } | null
  >(null);
  const [voices, setVoices] = React.useState<Voice[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = React.useState<string | undefined>(undefined);
  const [personalVoiceStatus, setPersonalVoiceStatus] =
    React.useState<PersonalVoiceAuthorizationStatus>(
      isIOS17Plus() ? 'notDetermined' : 'unsupported',
    );
  const [pauseSupported, setPauseSupported] = React.useState(true);

  const subscriptionsRef = React.useRef<SpeechBridgeSubscription[]>([]);
  const mountedRef = React.useRef(true);
  const statusRef = React.useRef<TransportState>('idle');

  const safeSetStatus = React.useCallback((next: TransportState) => {
    statusRef.current = next;
    if (mountedRef.current) setStatus(next);
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

  const subscribeAll = React.useCallback(() => {
    unsubscribe();
    const add = <E extends SynthEventName>(
      name: E,
      fn: (payload: SynthEventPayloads[E]) => void,
    ) => {
      const sub = bridge.events.addListener(name, fn);
      subscriptionsRef.current.push(sub);
    };

    add('didStart', () => {
      safeSetStatus('speaking');
    });
    add('didFinish', () => {
      safeSetStatus('idle');
      if (mountedRef.current) setCurrentWordRange(null);
    });
    add('didPause', () => {
      safeSetStatus('paused');
    });
    add('didContinue', () => {
      safeSetStatus('speaking');
    });
    add('didCancel', () => {
      safeSetStatus('idle');
      if (mountedRef.current) setCurrentWordRange(null);
    });
    add('willSpeakWord', (payload: WordBoundaryEvent) => {
      if (mountedRef.current) setCurrentWordRange(payload.range);
    });
  }, [bridge, safeSetStatus, unsubscribe]);

  // Mount-time: voices + pause support + personal-voice probe.
  React.useEffect(() => {
    let cancelled = false;

    bridge.availableVoices().then(
      (list) => {
        if (!cancelled && mountedRef.current) setVoices(list);
      },
      () => {
        // ignore
      },
    );

    // Pause-support probe: only valid when speaking, so we treat any
    // non-PauseUnsupported rejection as "supported" (the bridge is just
    // saying "nothing to pause"). We catch PauseUnsupported as the strong
    // signal to disable Pause/Continue.
    bridge.pause().then(
      () => {
        // Already speaking and paused successfully — should not normally
        // happen at mount. Reset.
        bridge.stop().catch(() => {});
      },
      (err: unknown) => {
        if (err instanceof SpeechSynthesisPauseUnsupported) {
          if (!cancelled && mountedRef.current) setPauseSupported(false);
        }
        bridge.stop().catch(() => {});
      },
    );

    if (isIOS17Plus()) {
      bridge.requestPersonalVoiceAuthorization().then(
        (s) => {
          if (!cancelled && mountedRef.current) setPersonalVoiceStatus(s);
        },
        () => {
          // ignore
        },
      );
    }

    return () => {
      cancelled = true;
    };
  }, [bridge]);

  const speak = React.useCallback(
    async (args: SpeakArgs) => {
      subscribeAll();
      await bridge.speak({ ...args, voiceId: args.voiceId ?? selectedVoiceId });
    },
    [bridge, selectedVoiceId, subscribeAll],
  );

  const pause = React.useCallback(async () => {
    try {
      await bridge.pause();
    } catch (err) {
      if (err instanceof SpeechSynthesisPauseUnsupported) {
        if (mountedRef.current) setPauseSupported(false);
      }
    }
  }, [bridge]);

  const continueFn = React.useCallback(async () => {
    try {
      await bridge.continue();
    } catch (err) {
      if (err instanceof SpeechSynthesisPauseUnsupported) {
        if (mountedRef.current) setPauseSupported(false);
      }
    }
  }, [bridge]);

  const stop = React.useCallback(async () => {
    try {
      await bridge.stop();
    } catch {
      // idempotent
    }
  }, [bridge]);

  const selectVoice = React.useCallback((id: string | undefined) => {
    setSelectedVoiceId(id);
  }, []);

  const requestPersonalVoice = React.useCallback(async () => {
    const next = await bridge.requestPersonalVoiceAuthorization();
    if (mountedRef.current) setPersonalVoiceStatus(next);
    return next;
  }, [bridge]);

  // Unmount cleanup.
  React.useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (statusRef.current !== 'idle') {
        void bridge.stop().catch(() => {});
      }
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
    status,
    currentWordRange,
    voices,
    selectedVoiceId,
    personalVoiceStatus,
    pauseSupported,
    selectVoice,
    speak,
    pause,
    continue: continueFn,
    stop,
    requestPersonalVoice,
  };
}
