/**
 * T062: SpeechSynthesisLab screen.android tests.
 */

import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import { SpeechSynthesisPauseUnsupported } from '@/native/speech-synthesis.types';

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
        { id: 'a1', name: 'Andy', language: 'en-US', quality: 'Default', isPersonalVoice: false },
      ]),
    ),
    speak: jest.fn(() => Promise.resolve()),
    pause: jest.fn(() => Promise.reject(new SpeechSynthesisPauseUnsupported())),
    continue: jest.fn(() => Promise.reject(new SpeechSynthesisPauseUnsupported())),
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
import AndroidScreen from '@/modules/speech-synthesis-lab/screen.android';

const { SpeechSynthesisPauseUnsupported: _ } = require('@/native/speech-synthesis.types');

const mockBridge = bridgeModule as unknown as {
  speak: jest.Mock;
  pause: jest.Mock;
};

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
  return root.findAll(
    (n: any) => n.props && n.props.accessibilityLabel === 'Text to speak',
  )[0];
}

beforeEach(() => {
  _listeners.length = 0;
  mockBridge.speak.mockClear();
  mockBridge.pause.mockClear();
});

describe('SpeechSynthesisLab Android screen', () => {
  it('mounts and does NOT render PersonalVoiceCard', async () => {
    const view = render(<AndroidScreen />);
    await flush();
    const cards = view.UNSAFE_root.findAll(
      (n: any) => n.props && n.props.testID === 'personal-voice-card',
    );
    expect(cards.length).toBe(0);
  });

  it('Pause + Continue rendered disabled (pauseSupported=false from probe)', async () => {
    const view = render(<AndroidScreen />);
    await flush();
    expect(findByLabel(view.UNSAFE_root, /^Pause$/).props.accessibilityState.disabled).toBe(true);
    expect(findByLabel(view.UNSAFE_root, /^Continue$/).props.accessibilityState.disabled).toBe(true);
  });

  it('Speak forwards to bridge.speak', async () => {
    const view = render(<AndroidScreen />);
    await flush();
    fireEvent.changeText(findInput(view.UNSAFE_root), 'Hi');
    await flush();
    await act(async () => {
      fireEvent.press(findByLabel(view.UNSAFE_root, /^Speak$/));
    });
    expect(mockBridge.speak).toHaveBeenCalledTimes(1);
  });

  it('full lifecycle raises no exceptions', async () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const view = render(<AndroidScreen />);
    await flush();
    fireEvent.changeText(findInput(view.UNSAFE_root), 'Hi');
    await flush();
    await act(async () => {
      fireEvent.press(findByLabel(view.UNSAFE_root, /^Speak$/));
    });
    await act(async () => {
      view.unmount();
    });
    expect(errSpy).not.toHaveBeenCalled();
    errSpy.mockRestore();
  });
});
