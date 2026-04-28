/**
 * T034: speech-recognition-lab screen test (US1, iOS variant).
 */

import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

const mockSetStringAsync: jest.Mock = jest.fn((..._args: unknown[]) => Promise.resolve());
jest.mock('expo-clipboard', () => ({
  __esModule: true,
  setStringAsync: (...args: unknown[]) => mockSetStringAsync(...args),
}));

interface Listener {
  event: 'partial' | 'final' | 'error';
  fn: (p: any) => void;
  removed: boolean;
}

jest.mock('@/native/speech-recognition', () => {
  const _listeners: Listener[] = [];
  const bridge = {
    isAvailable: jest.fn(() => true),
    availableLocales: jest.fn(() => ['en-US']),
    requestAuthorization: jest.fn(() => Promise.resolve('authorized')),
    getAuthorizationStatus: jest.fn(() => Promise.resolve('authorized')),
    start: jest.fn(() => Promise.resolve()),
    stop: jest.fn(() => Promise.resolve()),
    events: {
      addListener: jest.fn((event: any, fn: any) => {
        const entry: Listener = { event, fn, removed: false };
        _listeners.push(entry);
        return { remove: jest.fn(() => { entry.removed = true; }) };
      }),
      removeAllListeners: jest.fn(() =>
        _listeners.forEach((e) => { e.removed = true; }),
      ),
    },
    __listeners: _listeners,
  };
  return { __esModule: true, default: bridge };
});

import bridgeModule from '@/native/speech-recognition';
import SpeechRecognitionScreen from '@/modules/speech-recognition-lab/screen';

const mockBridge = bridgeModule as unknown as {
  isAvailable: jest.Mock;
  availableLocales: jest.Mock;
  requestAuthorization: jest.Mock;
  getAuthorizationStatus: jest.Mock;
  start: jest.Mock;
  stop: jest.Mock;
  events: { addListener: jest.Mock; removeAllListeners: jest.Mock };
  __listeners: Listener[];
};
const listeners = mockBridge.__listeners;

function emit(event: 'partial' | 'final' | 'error', payload: any) {
  for (const l of listeners) {
    if (l.event === event && !l.removed) l.fn(payload);
  }
}

function findButtonByLabel(root: any, regex: RegExp) {
  const buttons = root.findAll(
    (n: any) => n.props && n.props.accessibilityRole === 'button',
  );
  for (const b of buttons) {
    if (regex.test(String(b.props.accessibilityLabel ?? ''))) return b;
  }
  for (const b of buttons) {
    if (regex.test(JSON.stringify(b.props))) return b;
  }
  return null;
}

async function flushAsync() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('SpeechRecognitionLab screen (US1, iOS)', () => {
  beforeEach(() => {
    listeners.length = 0;
    mockSetStringAsync.mockClear();
    mockBridge.start.mockClear();
    mockBridge.stop.mockClear();
    mockBridge.requestAuthorization.mockClear();
    mockBridge.getAuthorizationStatus.mockClear();
    mockBridge.isAvailable.mockClear();
    mockBridge.isAvailable.mockReturnValue(true);
    mockBridge.getAuthorizationStatus.mockResolvedValue('authorized' as any);
  });

  it('renders without crashing and mounts the placeholder transcript', async () => {
    const view = render(<SpeechRecognitionScreen />);
    await flushAsync();
    expect(view.toJSON()).toBeTruthy();
    expect(screen.queryByText(/tap the mic to start/i)).toBeTruthy();
  });

  it('tapping MicButton calls bridge.start with current locale + onDevice=false', async () => {
    const view = render(<SpeechRecognitionScreen />);
    await flushAsync();
    const micBtn = findButtonByLabel(view.UNSAFE_root, /microphone|start microphone|stop microphone/i);
    expect(micBtn).toBeTruthy();
    await act(async () => {
      fireEvent.press(micBtn);
    });
    expect(mockBridge.start).toHaveBeenCalledTimes(1);
    const callArgs = mockBridge.start.mock.calls[0][0] as { locale: string; onDevice: boolean };
    expect(typeof callArgs.locale).toBe('string');
    expect(callArgs.onDevice).toBe(false);
  });

  it('isListening flip updates AudioSessionIndicator label synchronously', async () => {
    const view = render(<SpeechRecognitionScreen />);
    await flushAsync();
    expect(screen.queryByText(/audio session inactive/i)).toBeTruthy();
    const micBtn = findButtonByLabel(view.UNSAFE_root, /microphone/i);
    await act(async () => {
      fireEvent.press(micBtn);
    });
    expect(screen.queryByText(/audio session active/i)).toBeTruthy();
  });

  it('partial then final events update the transcript', async () => {
    const view = render(<SpeechRecognitionScreen />);
    await flushAsync();
    const micBtn = findButtonByLabel(view.UNSAFE_root, /microphone/i);
    await act(async () => {
      fireEvent.press(micBtn);
    });
    await act(async () => {
      emit('partial', { transcript: 'the quick brown' });
    });
    expect(screen.queryByText(/the quick brown/i)).toBeTruthy();
    await act(async () => {
      emit('final', { transcript: 'the quick brown fox', isFinal: true });
    });
    expect(screen.queryByText(/the quick brown fox/i)).toBeTruthy();
  });

  it('tapping Clear empties the final transcript', async () => {
    const view = render(<SpeechRecognitionScreen />);
    await flushAsync();
    const micBtn = findButtonByLabel(view.UNSAFE_root, /microphone/i);
    await act(async () => {
      fireEvent.press(micBtn);
    });
    await act(async () => {
      emit('final', { transcript: 'hello', isFinal: true });
    });
    expect(screen.queryByText(/hello/i)).toBeTruthy();

    const clearBtn = findButtonByLabel(view.UNSAFE_root, /clear/i);
    await act(async () => {
      fireEvent.press(clearBtn);
    });
    expect(screen.queryByText(/tap the mic to start/i)).toBeTruthy();
  });

  it('tapping Copy invokes Clipboard.setStringAsync with current final', async () => {
    const view = render(<SpeechRecognitionScreen />);
    await flushAsync();
    const micBtn = findButtonByLabel(view.UNSAFE_root, /microphone/i);
    await act(async () => {
      fireEvent.press(micBtn);
    });
    await act(async () => {
      emit('final', { transcript: 'copy me', isFinal: true });
    });
    const copyBtn = findButtonByLabel(view.UNSAFE_root, /copy/i);
    await act(async () => {
      fireEvent.press(copyBtn);
    });
    expect(mockSetStringAsync).toHaveBeenCalledTimes(1);
    expect(String(mockSetStringAsync.mock.calls[0][0])).toContain('copy me');
  });

  it('full lifecycle (mount → start → partial → final → stop → unmount) raises no exceptions', async () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const view = render(<SpeechRecognitionScreen />);
    await flushAsync();
    const micBtn = findButtonByLabel(view.UNSAFE_root, /microphone/i);
    await act(async () => {
      fireEvent.press(micBtn);
    });
    await act(async () => {
      emit('partial', { transcript: 'hi' });
    });
    await act(async () => {
      emit('final', { transcript: 'hi there', isFinal: true });
    });
    await act(async () => {
      fireEvent.press(micBtn);
    });
    await act(async () => {
      view.unmount();
    });
    expect(errSpy).not.toHaveBeenCalled();
    errSpy.mockRestore();
  });
});
