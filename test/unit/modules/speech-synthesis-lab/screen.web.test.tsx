/**
 * T063 + T064: SpeechSynthesisLab screen.web tests.
 */

import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

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
        {
          id: 'w1',
          name: 'WebAlex',
          language: 'en-US',
          quality: 'Default',
          isPersonalVoice: false,
        },
      ]),
    ),
    speak: jest.fn(() => Promise.resolve()),
    pause: jest.fn(() => Promise.resolve()),
    continue: jest.fn(() => Promise.resolve()),
    stop: jest.fn(() => Promise.resolve()),
    isSpeaking: jest.fn(() => false),
    requestPersonalVoiceAuthorization: jest.fn(() => Promise.resolve('unsupported')),
    events: {
      addListener: jest.fn((event: any, fn: any) => {
        const entry: Listener = { event, fn, removed: false };
        _listeners.push(entry);
        return { remove: jest.fn(() => (entry.removed = true)) };
      }),
      removeAllListeners: jest.fn(),
    },
  };
  return { __esModule: true, default: bridge };
});

import bridgeModule from '@/native/speech-synthesis';
import WebScreen from '@/modules/speech-synthesis-lab/screen.web';

const mockBridge = bridgeModule as unknown as { speak: jest.Mock; availableVoices: jest.Mock };

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
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
  return root.findAll((n: any) => n.props && n.props.accessibilityLabel === 'Text to speak')[0];
}

beforeEach(() => {
  _listeners.length = 0;
  mockBridge.speak.mockClear();
  mockBridge.availableVoices.mockClear();
  mockBridge.availableVoices.mockResolvedValue([
    { id: 'w1', name: 'WebAlex', language: 'en-US', quality: 'Default', isPersonalVoice: false },
  ]);
});

describe('SpeechSynthesisLab Web screen — bridge present', () => {
  it('mounts and does NOT render PersonalVoiceCard', async () => {
    const view = render(<WebScreen />);
    await flush();
    const cards = view.UNSAFE_root.findAll(
      (n: any) => n.props && n.props.testID === 'personal-voice-card',
    );
    expect(cards.length).toBe(0);
  });

  it('typing then Speak calls bridge.speak with iOS-domain Normal defaults', async () => {
    const view = render(<WebScreen />);
    await flush();
    fireEvent.changeText(findInput(view.UNSAFE_root), 'Hi');
    await flush();
    await act(async () => {
      fireEvent.press(findByLabel(view.UNSAFE_root, /^Speak$/));
    });
    expect(mockBridge.speak).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'Hi', rate: 0.5, pitch: 1.0, volume: 0.7 }),
    );
  });
});

describe('SpeechSynthesisLab Web screen — bridge absent (NOOP)', () => {
  it('renders gracefully with empty voice list and Speak disabled when text empty', async () => {
    mockBridge.availableVoices.mockResolvedValueOnce([]);
    const view = render(<WebScreen />);
    await flush();
    const speakBtn = findByLabel(view.UNSAFE_root, /^Speak$/);
    expect(speakBtn.props.accessibilityState.disabled).toBe(true);
  });

  it('full lifecycle raises no exceptions', async () => {
    mockBridge.availableVoices.mockResolvedValueOnce([]);
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const view = render(<WebScreen />);
    await flush();
    await act(async () => {
      view.unmount();
    });
    expect(errSpy).not.toHaveBeenCalled();
    errSpy.mockRestore();
  });
});
