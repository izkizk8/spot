/**
 * T057: speech-recognition-lab Android screen test.
 *
 * Verifies banner + every interactive surface disabled; bridge.start is
 * never invoked.
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

const mockStart = jest.fn();
const mockStop = jest.fn();

jest.mock('@/native/speech-recognition', () => {
  return {
    __esModule: true,
    default: {
      isAvailable: jest.fn(() => false),
      availableLocales: jest.fn(() => []),
      requestAuthorization: jest.fn(() => Promise.reject(new Error('NotSupported'))),
      getAuthorizationStatus: jest.fn(() => Promise.reject(new Error('NotSupported'))),
      start: mockStart,
      stop: mockStop,
      events: {
        addListener: jest.fn(() => ({ remove: jest.fn() })),
        removeAllListeners: jest.fn(),
      },
    },
  };
});

import AndroidScreen from '@/modules/speech-recognition-lab/screen.android';

describe('SpeechRecognitionLab screen (Android — US5)', () => {
  beforeEach(() => {
    mockStart.mockClear();
    mockStop.mockClear();
  });

  it('renders the IOSOnlyBanner', () => {
    render(<AndroidScreen />);
    expect(screen.queryByText(/iOS-only/i)).toBeTruthy();
  });

  it('renders the mic button in disabled state', () => {
    const view = render(<AndroidScreen />);
    const buttons = view.UNSAFE_root.findAll(
      (n: any) => n.props && n.props.accessibilityRole === 'button',
    );
    const micBtn = buttons.find((b: any) =>
      /microphone/i.test(String(b.props.accessibilityLabel ?? '')),
    );
    expect(micBtn).toBeTruthy();
    expect(micBtn.props.accessibilityState).toMatchObject({ disabled: true });
  });

  it('tapping the mic button never invokes bridge.start', () => {
    const view = render(<AndroidScreen />);
    const buttons = view.UNSAFE_root.findAll(
      (n: any) => n.props && n.props.accessibilityRole === 'button',
    );
    const micBtn = buttons.find((b: any) =>
      /microphone/i.test(String(b.props.accessibilityLabel ?? '')),
    );
    fireEvent.press(micBtn);
    expect(mockStart).not.toHaveBeenCalled();
  });

  it('renders LocalePicker and RecognitionModePicker as inert', () => {
    const view = render(<AndroidScreen />);
    const buttons = view.UNSAFE_root.findAll(
      (n: any) => n.props && n.props.accessibilityRole === 'button',
    );
    const localeChip = buttons.find((b: any) =>
      /select locale ja-JP/i.test(String(b.props.accessibilityLabel ?? '')),
    );
    expect(localeChip).toBeTruthy();
    expect(localeChip.props.accessibilityState).toMatchObject({ disabled: true });

    const onDeviceSeg = buttons.find((b: any) =>
      /on-device/i.test(String(b.props.accessibilityLabel ?? '')),
    );
    expect(onDeviceSeg).toBeTruthy();
    expect(onDeviceSeg.props.accessibilityState).toMatchObject({ disabled: true });
  });

  it('full mount → tap-attempts → unmount raises no console errors', () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const view = render(<AndroidScreen />);
    const buttons = view.UNSAFE_root.findAll(
      (n: any) => n.props && n.props.accessibilityRole === 'button',
    );
    for (const b of buttons) fireEvent.press(b);
    view.unmount();
    expect(errSpy).not.toHaveBeenCalled();
    errSpy.mockRestore();
  });
});

