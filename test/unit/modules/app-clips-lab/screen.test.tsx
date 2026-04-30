/**
 * Unit tests: app-clips-lab iOS screen.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import AppClipsLabScreen from '@/modules/app-clips-lab/screen';
import { simulatorStore } from '@/modules/app-clips-lab/simulator-store';

describe('app-clips-lab screen (iOS)', () => {
  beforeEach(() => {
    simulatorStore.clear();
  });

  it('renders Explainer, Simulator, PayloadViewer, SetupInstructions, LimitationsCard', () => {
    const { getByText, getAllByText } = render(<AppClipsLabScreen />);
    expect(getByText(/About App Clips/)).toBeTruthy();
    expect(getByText(/Invocation Simulator/)).toBeTruthy();
    expect(getAllByText(/Payload Viewer/).length).toBeGreaterThan(0);
    expect(getByText(/Setup Instructions/)).toBeTruthy();
    expect(getByText(/Limitations/)).toBeTruthy();
  });

  it('starts in empty payload state', () => {
    const { getByTestId } = render(<AppClipsLabScreen />);
    expect(getByTestId('payload-empty')).toBeTruthy();
  });

  it('Simulate launch button pushes a payload visible in the viewer', () => {
    const { getByTestId, queryByTestId } = render(<AppClipsLabScreen />);
    fireEvent.press(getByTestId('simulate-launch-btn'));
    expect(queryByTestId('payload-empty')).toBeNull();
    expect(getByTestId('payload-latest')).toBeTruthy();
  });

  it('selecting a source toggle and simulating uses that source', () => {
    const { getByTestId, getByText } = render(<AppClipsLabScreen />);
    fireEvent.press(getByTestId('source-toggle-nfc'));
    fireEvent.press(getByTestId('simulate-launch-btn'));
    expect(getByText(/source: NFC/)).toBeTruthy();
  });

  it('Clear button empties the payload list', () => {
    const { getByTestId, queryByTestId } = render(<AppClipsLabScreen />);
    fireEvent.press(getByTestId('simulate-launch-btn'));
    fireEvent.press(getByTestId('clear-payloads-btn'));
    expect(getByTestId('payload-empty')).toBeTruthy();
    expect(queryByTestId('payload-latest')).toBeNull();
  });
});
