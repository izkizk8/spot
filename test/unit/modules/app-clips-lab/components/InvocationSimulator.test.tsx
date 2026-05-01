/**
 * Unit tests: InvocationSimulator — App Clips Lab.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import InvocationSimulator from '@/modules/app-clips-lab/components/InvocationSimulator';

describe('InvocationSimulator', () => {
  it('renders a heading and a non-zero number of source toggles', () => {
    const onSimulate = jest.fn();
    const { getByText, getByTestId } = render(<InvocationSimulator onSimulate={onSimulate} />);
    expect(getByText(/Invocation Simulator/)).toBeTruthy();
    expect(getByTestId('invocation-source-row')).toBeTruthy();
    expect(getByTestId('source-toggle-nfc')).toBeTruthy();
    expect(getByTestId('source-toggle-qr')).toBeTruthy();
    expect(getByTestId('source-toggle-default')).toBeTruthy();
  });

  it('Simulate launch button calls onSimulate with default source', () => {
    const onSimulate = jest.fn();
    const { getByTestId } = render(<InvocationSimulator onSimulate={onSimulate} />);
    fireEvent.press(getByTestId('simulate-launch-btn'));
    expect(onSimulate).toHaveBeenCalledTimes(1);
    expect(onSimulate.mock.calls[0][0].source).toBe('default');
  });

  it('selecting a different source persists in subsequent simulate', () => {
    const onSimulate = jest.fn();
    const { getByTestId } = render(<InvocationSimulator onSimulate={onSimulate} />);
    fireEvent.press(getByTestId('source-toggle-maps'));
    fireEvent.press(getByTestId('simulate-launch-btn'));
    expect(onSimulate).toHaveBeenCalledTimes(1);
    expect(onSimulate.mock.calls[0][0].source).toBe('maps');
  });

  it('payload includes a non-empty url and metadata', () => {
    const onSimulate = jest.fn();
    const { getByTestId } = render(<InvocationSimulator onSimulate={onSimulate} />);
    fireEvent.press(getByTestId('source-toggle-qr'));
    fireEvent.press(getByTestId('simulate-launch-btn'));
    const payload = onSimulate.mock.calls[0][0];
    expect(payload.url.length).toBeGreaterThan(0);
    expect(payload.metadata.surface).toBe('qr');
  });

  it('produces a non-empty snapshot', () => {
    const { toJSON } = render(<InvocationSimulator onSimulate={jest.fn()} />);
    expect(toJSON()).toBeTruthy();
  });
});
