/**
 * T058 + T059: speech-recognition-lab Web screen tests.
 *
 * Two describe blocks:
 *   - webkitSpeechRecognition PRESENT → full screen renders; On-device
 *     segment is disabled (FR-023); tapping the mic invokes bridge.start
 *     with onDevice forced to false.
 *   - webkitSpeechRecognition ABSENT → IOSOnlyBanner + disabled mic; the
 *     mic tap is a no-op and never invokes bridge.start.
 */

import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

const mockSetStringAsync: jest.Mock = jest.fn(() => Promise.resolve());
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
    availableLocales: jest.fn(() => ['en-US', 'ja-JP']),
    requestAuthorization: jest.fn(() => Promise.resolve('authorized')),
    getAuthorizationStatus: jest.fn(() => Promise.resolve('authorized')),
    start: jest.fn(() => Promise.resolve()),
    stop: jest.fn(() => Promise.resolve()),
    // Note: NOT exposing supportsOnDeviceRecognition — web has no probe,
    // so the screen should treat On-device as unavailable.
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
      removeAllListeners: jest.fn(),
    },
    __listeners: _listeners,
  };
  return { __esModule: true, default: bridge };
});

import bridgeModule from '@/native/speech-recognition';
import WebScreen from '@/modules/speech-recognition-lab/screen.web';

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

async function flushAsync() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

function findButton(root: any, regex: RegExp) {
  const buttons = root.findAll((n: any) => n.props && n.props.accessibilityRole === 'button');
  return buttons.find((b: any) => regex.test(String(b.props.accessibilityLabel ?? ''))) ?? null;
}

describe('SpeechRecognitionLab screen (Web — webkitSpeechRecognition present)', () => {
  beforeEach(() => {
    (globalThis as any).webkitSpeechRecognition = function () {};
    mockBridge.start.mockClear();
    mockBridge.stop.mockClear();
    mockBridge.isAvailable.mockClear();
    mockBridge.isAvailable.mockReturnValue(true);
    mockBridge.getAuthorizationStatus.mockResolvedValue('authorized' as any);
    mockBridge.__listeners.length = 0;
  });

  afterEach(() => {
    delete (globalThis as any).webkitSpeechRecognition;
  });

  it('renders the full screen (no banner)', async () => {
    render(<WebScreen />);
    await flushAsync();
    expect(screen.queryByText(/iOS-only/i)).toBeNull();
  });

  it('On-device segment is disabled (web forces Server-only per FR-023)', async () => {
    const view = render(<WebScreen />);
    await flushAsync();
    const onDevice = findButton(view.UNSAFE_root, /on-device/i);
    expect(onDevice).toBeTruthy();
    expect(onDevice.props.accessibilityState).toMatchObject({ disabled: true });
  });

  it('tapping the mic invokes bridge.start with onDevice=false', async () => {
    const view = render(<WebScreen />);
    await flushAsync();
    const micBtn = findButton(view.UNSAFE_root, /microphone/i);
    expect(micBtn).toBeTruthy();
    await act(async () => {
      fireEvent.press(micBtn);
    });
    expect(mockBridge.start).toHaveBeenCalledTimes(1);
    expect(mockBridge.start.mock.calls[0][0]).toMatchObject({ onDevice: false });
  });
});

describe('SpeechRecognitionLab screen (Web — webkitSpeechRecognition absent)', () => {
  beforeEach(() => {
    delete (globalThis as any).webkitSpeechRecognition;
    mockBridge.start.mockClear();
    mockBridge.stop.mockClear();
  });

  it('renders the IOSOnlyBanner', () => {
    render(<WebScreen />);
    expect(screen.queryByText(/iOS-only/i)).toBeTruthy();
  });

  it('renders the mic in disabled state', () => {
    const view = render(<WebScreen />);
    const micBtn = findButton(view.UNSAFE_root, /microphone/i);
    expect(micBtn).toBeTruthy();
    expect(micBtn.props.accessibilityState).toMatchObject({ disabled: true });
  });

  it('tapping the mic never invokes bridge.start', () => {
    const view = render(<WebScreen />);
    const micBtn = findButton(view.UNSAFE_root, /microphone/i);
    fireEvent.press(micBtn);
    expect(mockBridge.start).not.toHaveBeenCalled();
  });

  it('full mount → tap-attempts → unmount raises no console errors', () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const view = render(<WebScreen />);
    const buttons = view.UNSAFE_root.findAll(
      (n: any) => n.props && n.props.accessibilityRole === 'button',
    );
    for (const b of buttons) fireEvent.press(b);
    view.unmount();
    expect(errSpy).not.toHaveBeenCalled();
    errSpy.mockRestore();
  });
});
