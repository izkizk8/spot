/**
 * T043: RecognitionModePicker tests (US2).
 *
 * Coverage:
 *   - Renders Server + On-device segments
 *   - Tapping enabled segment invokes onModeChange
 *   - When `onDeviceAvailable={false}`, On-device renders disabled with the
 *     documented accessibility metadata; tap is a no-op
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import RecognitionModePicker from '@/modules/speech-recognition-lab/components/RecognitionModePicker';

function findSegment(root: any, label: string) {
  const buttons = root.findAll((n: any) => n.props && n.props.accessibilityRole === 'button');
  for (const b of buttons) {
    const al = String(b.props.accessibilityLabel ?? '');
    if (al.toLowerCase().includes(label.toLowerCase())) return b;
  }
  return null;
}

describe('RecognitionModePicker (US2)', () => {
  it('renders both Server and On-device segments', () => {
    const view = render(
      <RecognitionModePicker mode="server" onDeviceAvailable={true} onModeChange={jest.fn()} />,
    );
    expect(findSegment(view.UNSAFE_root, 'Server')).toBeTruthy();
    expect(findSegment(view.UNSAFE_root, 'On-device')).toBeTruthy();
  });

  it('reflects the `mode` prop in selected accessibility state', () => {
    const view = render(
      <RecognitionModePicker mode="on-device" onDeviceAvailable={true} onModeChange={jest.fn()} />,
    );
    const onDevice = findSegment(view.UNSAFE_root, 'On-device');
    expect(onDevice.props.accessibilityState).toMatchObject({ selected: true });
    const server = findSegment(view.UNSAFE_root, 'Server');
    expect(server.props.accessibilityState).toMatchObject({ selected: false });
  });

  it('tapping a segment invokes onModeChange exactly once', () => {
    const onModeChange = jest.fn();
    const view = render(
      <RecognitionModePicker mode="server" onDeviceAvailable={true} onModeChange={onModeChange} />,
    );
    const onDevice = findSegment(view.UNSAFE_root, 'On-device');
    fireEvent.press(onDevice);
    expect(onModeChange).toHaveBeenCalledTimes(1);
    expect(onModeChange).toHaveBeenCalledWith('on-device');
  });

  describe('On-device disabled when !onDeviceAvailable', () => {
    it('renders On-device segment with accessibilityState.disabled=true', () => {
      const view = render(
        <RecognitionModePicker mode="server" onDeviceAvailable={false} onModeChange={jest.fn()} />,
      );
      const onDevice = findSegment(view.UNSAFE_root, 'On-device');
      expect(onDevice.props.accessibilityState).toMatchObject({ disabled: true });
    });

    it('uses the documented accessibilityLabel for the disabled On-device segment', () => {
      const view = render(
        <RecognitionModePicker mode="server" onDeviceAvailable={false} onModeChange={jest.fn()} />,
      );
      const buttons = view.UNSAFE_root.findAll(
        (n: any) => n.props && n.props.accessibilityRole === 'button',
      );
      const labels = buttons.map((b: any) => String(b.props.accessibilityLabel ?? ''));
      const found = labels.some((l: string) => /on-device recognition not available/i.test(l));
      expect(found).toBe(true);
    });

    it('tapping the disabled On-device segment is a no-op', () => {
      const onModeChange = jest.fn();
      const view = render(
        <RecognitionModePicker
          mode="server"
          onDeviceAvailable={false}
          onModeChange={onModeChange}
        />,
      );
      const onDevice = findSegment(view.UNSAFE_root, 'On-device');
      fireEvent.press(onDevice);
      expect(onModeChange).not.toHaveBeenCalled();
    });

    it('Server segment remains tappable when On-device is disabled', () => {
      const onModeChange = jest.fn();
      const view = render(
        <RecognitionModePicker
          mode="on-device"
          onDeviceAvailable={false}
          onModeChange={onModeChange}
        />,
      );
      const server = findSegment(view.UNSAFE_root, 'Server');
      fireEvent.press(server);
      expect(onModeChange).toHaveBeenCalledWith('server');
    });
  });

  it('On-device segment is enabled when onDeviceAvailable=true', () => {
    const view = render(
      <RecognitionModePicker mode="server" onDeviceAvailable={true} onModeChange={jest.fn()} />,
    );
    const onDevice = findSegment(view.UNSAFE_root, 'On-device');
    expect(onDevice.props.accessibilityState?.disabled).toBeFalsy();
  });
});
