/**
 * T027 + T034 + T041 + T046 + T050 + T057: SpeechSynthesisLab screen tests (iOS).
 */

import React from 'react';
import { Platform } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

interface Listener {
  event: string;
  fn: (p: any) => void;
  removed: boolean;
}

const _listeners: Listener[] = [];

jest.mock('@/native/speech-synthesis', () => {
  const bridge = {
    availableVoices: jest.fn(() =>
      Promise.resolve([
        { id: 'v1', name: 'Alex', language: 'en-US', quality: 'Default', isPersonalVoice: false },
        { id: 'v2', name: 'Kyoko', language: 'ja-JP', quality: 'Default', isPersonalVoice: false },
      ]),
    ),
    speak: jest.fn(() => Promise.resolve()),
    pause: jest.fn(() => Promise.resolve()),
    continue: jest.fn(() => Promise.resolve()),
    stop: jest.fn(() => Promise.resolve()),
    isSpeaking: jest.fn(() => false),
    requestPersonalVoiceAuthorization: jest.fn(() => Promise.resolve('notDetermined')),
    events: {
      addListener: jest.fn((event: any, fn: any) => {
        const entry: Listener = { event, fn, removed: false };
        _listeners.push(entry);
        return {
          remove: jest.fn(() => {
            entry.removed = true;
          }),
        };
      }),
      removeAllListeners: jest.fn(() => {
        for (const e of _listeners) e.removed = true;
      }),
    },
  };
  return { __esModule: true, default: bridge };
});

import bridgeModule from '@/native/speech-synthesis';
import SpeechSynthesisScreen from '@/modules/speech-synthesis-lab/screen';

const mockBridge = bridgeModule as unknown as {
  availableVoices: jest.Mock;
  speak: jest.Mock;
  pause: jest.Mock;
  continue: jest.Mock;
  stop: jest.Mock;
  requestPersonalVoiceAuthorization: jest.Mock;
  events: { addListener: jest.Mock; removeAllListeners: jest.Mock };
};

function emit(event: string, payload: any) {
  for (const l of _listeners) {
    if (l.event === event && !l.removed) l.fn(payload);
  }
}

function findByLabel(root: any, regex: RegExp) {
  return root.findAll(
    (n: any) =>
      n.props &&
      n.props.accessibilityRole === 'button' &&
      regex.test(String(n.props.accessibilityLabel ?? '')),
  )[0];
}

function findInput(root: any) {
  return root.findAll(
    (n: any) => n.props && n.props.accessibilityLabel === 'Text to speak',
  )[0];
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

beforeEach(() => {
  _listeners.length = 0;
  mockBridge.speak.mockClear();
  mockBridge.pause.mockClear();
  mockBridge.continue.mockClear();
  mockBridge.stop.mockClear();
  mockBridge.availableVoices.mockClear();
  mockBridge.requestPersonalVoiceAuthorization.mockClear();
  mockBridge.availableVoices.mockResolvedValue([
    { id: 'v1', name: 'Alex', language: 'en-US', quality: 'Default', isPersonalVoice: false },
    { id: 'v2', name: 'Kyoko', language: 'ja-JP', quality: 'Default', isPersonalVoice: false },
  ]);
  mockBridge.requestPersonalVoiceAuthorization.mockResolvedValue('notDetermined');
});

describe('SpeechSynthesisLab screen — US1 transport', () => {
  it('mounts; Speak disabled while text is empty', async () => {
    const view = render(<SpeechSynthesisScreen />);
    await flush();
    expect(view.toJSON()).toBeTruthy();
    const speakBtn = findByLabel(view.UNSAFE_root, /^Speak$/);
    expect(speakBtn.props.accessibilityState.disabled).toBe(true);
  });

  it('typing text enables Speak; pressing it calls bridge.speak with iOS-domain Normal defaults', async () => {
    const view = render(<SpeechSynthesisScreen />);
    await flush();
    const input = findInput(view.UNSAFE_root);
    fireEvent.changeText(input, 'Hello');
    await flush();
    const speakBtn = findByLabel(view.UNSAFE_root, /^Speak$/);
    expect(speakBtn.props.accessibilityState.disabled).toBe(false);
    await act(async () => {
      fireEvent.press(speakBtn);
    });
    expect(mockBridge.speak).toHaveBeenCalledTimes(1);
    expect(mockBridge.speak.mock.calls[0]?.[0]).toMatchObject({
      text: 'Hello',
      rate: 0.5,
      pitch: 1.0,
      volume: 0.7,
    });
  });

  it('didStart → speaking; Pause press → pause(); didPause → paused; Continue → continue(); didCancel → idle', async () => {
    const view = render(<SpeechSynthesisScreen />);
    await flush();
    const input = findInput(view.UNSAFE_root);
    fireEvent.changeText(input, 'Hello');
    await flush();
    await act(async () => {
      fireEvent.press(findByLabel(view.UNSAFE_root, /^Speak$/));
    });
    await act(async () => {
      emit('didStart', {});
    });
    const pauseBtn = findByLabel(view.UNSAFE_root, /^Pause$/);
    expect(pauseBtn.props.accessibilityState.disabled).toBe(false);
    await act(async () => {
      fireEvent.press(pauseBtn);
    });
    expect(mockBridge.pause).toHaveBeenCalledTimes(1);
    await act(async () => {
      emit('didPause', {});
    });
    const continueBtn = findByLabel(view.UNSAFE_root, /^Continue$/);
    expect(continueBtn.props.accessibilityState.disabled).toBe(false);
    await act(async () => {
      fireEvent.press(continueBtn);
    });
    expect(mockBridge.continue).toHaveBeenCalledTimes(1);
    await act(async () => {
      emit('didContinue', {});
    });
    const stopBtn = findByLabel(view.UNSAFE_root, /^Stop$/);
    await act(async () => {
      fireEvent.press(stopBtn);
    });
    expect(mockBridge.stop).toHaveBeenCalled();
    await act(async () => {
      emit('didCancel', {});
    });
    // After cancel, transport returns to idle and Speak (with text) re-enabled.
    expect(findByLabel(view.UNSAFE_root, /^Speak$/).props.accessibilityState.disabled).toBe(false);
  });

  it('didFinish (natural end) returns transport to idle without manual stop', async () => {
    const view = render(<SpeechSynthesisScreen />);
    await flush();
    fireEvent.changeText(findInput(view.UNSAFE_root), 'Hello');
    await flush();
    await act(async () => {
      fireEvent.press(findByLabel(view.UNSAFE_root, /^Speak$/));
      emit('didStart', {});
    });
    await act(async () => {
      emit('didFinish', {});
    });
    expect(findByLabel(view.UNSAFE_root, /^Speak$/).props.accessibilityState.disabled).toBe(false);
  });

  it('full lifecycle raises no exceptions', async () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const view = render(<SpeechSynthesisScreen />);
    await flush();
    fireEvent.changeText(findInput(view.UNSAFE_root), 'Hello');
    await flush();
    await act(async () => {
      fireEvent.press(findByLabel(view.UNSAFE_root, /^Speak$/));
      emit('didStart', {});
      emit('willSpeakWord', { range: { location: 0, length: 5 }, fullText: 'Hello' });
      emit('didFinish', {});
    });
    await act(async () => {
      view.unmount();
    });
    expect(errSpy).not.toHaveBeenCalled();
    errSpy.mockRestore();
  });
});

describe('SpeechSynthesisLab screen — US2 voice picker', () => {
  it('renders the voice picker with mocked voices and selecting injects voiceId on Speak', async () => {
    const view = render(<SpeechSynthesisScreen />);
    await flush();
    const kyokoRow = findByLabel(view.UNSAFE_root, /Select voice Kyoko/);
    expect(kyokoRow).toBeTruthy();
    await act(async () => {
      fireEvent.press(kyokoRow);
    });
    fireEvent.changeText(findInput(view.UNSAFE_root), 'Hi');
    await flush();
    await act(async () => {
      fireEvent.press(findByLabel(view.UNSAFE_root, /^Speak$/));
    });
    expect(mockBridge.speak.mock.calls[0]?.[0]).toMatchObject({ voiceId: 'v2' });
  });

  it('renders empty placeholder when voices is empty', async () => {
    mockBridge.availableVoices.mockResolvedValueOnce([]);
    render(<SpeechSynthesisScreen />);
    await flush();
    expect(screen.queryByText(/no voices available/i)).toBeTruthy();
  });
});

describe('SpeechSynthesisLab screen — US3 rate/pitch/volume', () => {
  it('changing presets affects only the next Speak (FR-016)', async () => {
    const view = render(<SpeechSynthesisScreen />);
    await flush();
    fireEvent.changeText(findInput(view.UNSAFE_root), 'Hi');
    await flush();
    await act(async () => {
      fireEvent.press(findByLabel(view.UNSAFE_root, /^Rate: Fast$/));
    });
    await act(async () => {
      fireEvent.press(findByLabel(view.UNSAFE_root, /^Pitch: Low$/));
    });
    await act(async () => {
      fireEvent.press(findByLabel(view.UNSAFE_root, /^Volume: High$/));
    });
    // Mid-utterance: pretend we're already speaking, change preset, verify NO new speak.
    await act(async () => {
      fireEvent.press(findByLabel(view.UNSAFE_root, /^Speak$/));
      emit('didStart', {});
    });
    expect(mockBridge.speak).toHaveBeenCalledTimes(1);
    expect(mockBridge.speak.mock.calls[0]?.[0]).toMatchObject({
      rate: 0.6,
      pitch: 0.75,
      volume: 1.0,
    });
    // Change preset mid-utterance: NO additional speak / stop call.
    const speakCallsBefore = mockBridge.speak.mock.calls.length;
    const stopCallsBefore = mockBridge.stop.mock.calls.length;
    await act(async () => {
      fireEvent.press(findByLabel(view.UNSAFE_root, /^Rate: Slow$/));
    });
    expect(mockBridge.speak.mock.calls.length).toBe(speakCallsBefore);
    expect(mockBridge.stop.mock.calls.length).toBe(stopCallsBefore);
  });
});

describe('SpeechSynthesisLab screen — US4 sample preset chips', () => {
  it('tapping English fills the input with EN_SAMPLE byte-exact', async () => {
    const view = render(<SpeechSynthesisScreen />);
    await flush();
    const enBtn = findByLabel(view.UNSAFE_root, /Load English sample text/);
    await act(async () => {
      fireEvent.press(enBtn);
    });
    expect(findInput(view.UNSAFE_root).props.value).toBe(
      'The quick brown fox jumps over the lazy dog.',
    );
  });

  it('tapping Chinese / Japanese fill ZH_SAMPLE / JA_SAMPLE byte-exact', async () => {
    const view = render(<SpeechSynthesisScreen />);
    await flush();
    await act(async () => {
      fireEvent.press(findByLabel(view.UNSAFE_root, /Load Chinese sample text/));
    });
    expect(findInput(view.UNSAFE_root).props.value).toBe('敏捷的棕色狐狸跳过了懒狗。');
    await act(async () => {
      fireEvent.press(findByLabel(view.UNSAFE_root, /Load Japanese sample text/));
    });
    expect(findInput(view.UNSAFE_root).props.value).toBe(
      '素早い茶色の狐が怠け者の犬を飛び越えます。',
    );
  });
});

describe('SpeechSynthesisLab screen — US5 highlight overlay', () => {
  it('willSpeakWord ratchets currentWordRange; didFinish clears it', async () => {
    const view = render(<SpeechSynthesisScreen />);
    await flush();
    fireEvent.changeText(findInput(view.UNSAFE_root), 'The quick brown fox.');
    await flush();
    await act(async () => {
      fireEvent.press(findByLabel(view.UNSAFE_root, /^Speak$/));
      emit('didStart', {});
      emit('willSpeakWord', { range: { location: 0, length: 3 }, fullText: 'The quick brown fox.' });
    });
    let overlays = view.UNSAFE_root.findAll(
      (n: any) => n.props && n.props.testID === 'text-input-highlight-overlay',
    );
    expect(overlays.length).toBeGreaterThan(0);
    await act(async () => {
      emit('willSpeakWord', { range: { location: 4, length: 5 }, fullText: 'The quick brown fox.' });
    });
    overlays = view.UNSAFE_root.findAll(
      (n: any) => n.props && n.props.testID === 'text-input-highlight-overlay',
    );
    expect(overlays.length).toBeGreaterThan(0);
    await act(async () => {
      emit('didFinish', {});
    });
    overlays = view.UNSAFE_root.findAll(
      (n: any) => n.props && n.props.testID === 'text-input-highlight-overlay',
    );
    expect(overlays.length).toBe(0);
  });
});

describe('SpeechSynthesisLab screen — US6 PersonalVoiceCard gating', () => {
  const originalOS = Platform.OS;
  const originalVersion = Platform.Version;

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true });
    Object.defineProperty(Platform, 'Version', { value: originalVersion, configurable: true });
  });

  it('does NOT mount PersonalVoiceCard when Platform.Version < 17', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
    Object.defineProperty(Platform, 'Version', { value: '16.4', configurable: true });
    const view = render(<SpeechSynthesisScreen />);
    await flush();
    const cards = view.UNSAFE_root.findAll(
      (n: any) => n.props && n.props.testID === 'personal-voice-card',
    );
    expect(cards.length).toBe(0);
  });

  it('mounts PersonalVoiceCard when iOS 17+', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
    Object.defineProperty(Platform, 'Version', { value: '17.0', configurable: true });
    const view = render(<SpeechSynthesisScreen />);
    await flush();
    const cards = view.UNSAFE_root.findAll(
      (n: any) => n.props && n.props.testID === 'personal-voice-card',
    );
    expect(cards.length).toBe(1);
  });
});
