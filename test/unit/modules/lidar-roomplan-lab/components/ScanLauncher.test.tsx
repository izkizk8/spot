/**
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import ScanLauncher from '@/modules/lidar-roomplan-lab/components/ScanLauncher';

describe('ScanLauncher', () => {
  it('renders Start and Stop buttons', () => {
    const { getByTestId } = render(
      <ScanLauncher supported={true} isScanning={false} onStart={() => {}} onStop={() => {}} />,
    );
    expect(getByTestId('roomplan-scan-launcher')).toBeTruthy();
    expect(getByTestId('roomplan-start-scan-button')).toBeTruthy();
    expect(getByTestId('roomplan-stop-scan-button')).toBeTruthy();
  });

  it('disables Start when not supported', () => {
    const onStart = jest.fn();
    const { getByTestId } = render(
      <ScanLauncher supported={false} isScanning={false} onStart={onStart} onStop={() => {}} />,
    );
    fireEvent.press(getByTestId('roomplan-start-scan-button'));
    expect(onStart).not.toHaveBeenCalled();
  });

  it('disables Stop when not scanning', () => {
    const onStop = jest.fn();
    const { getByTestId } = render(
      <ScanLauncher supported={true} isScanning={false} onStart={() => {}} onStop={onStop} />,
    );
    fireEvent.press(getByTestId('roomplan-stop-scan-button'));
    expect(onStop).not.toHaveBeenCalled();
  });

  it('invokes onStart when Start is pressed and enabled', () => {
    const onStart = jest.fn();
    const { getByTestId } = render(
      <ScanLauncher supported={true} isScanning={false} onStart={onStart} onStop={() => {}} />,
    );
    fireEvent.press(getByTestId('roomplan-start-scan-button'));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('invokes onStop when Stop is pressed and scanning', () => {
    const onStop = jest.fn();
    const { getByTestId } = render(
      <ScanLauncher supported={true} isScanning={true} onStart={() => {}} onStop={onStop} />,
    );
    fireEvent.press(getByTestId('roomplan-stop-scan-button'));
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it('reflects the "Scanning…" label while in flight', () => {
    const { getByTestId } = render(
      <ScanLauncher supported={true} isScanning={true} onStart={() => {}} onStop={() => {}} />,
    );
    const button = getByTestId('roomplan-start-scan-button');
    expect(button.props.accessibilityState).toEqual(expect.objectContaining({ disabled: true }));
  });
});
