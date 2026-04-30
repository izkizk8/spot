/**
 * Unit tests: SetupInstructions — App Clips Lab.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import SetupInstructions from '@/modules/app-clips-lab/components/SetupInstructions';

describe('SetupInstructions (App Clips)', () => {
  it('renders a heading and a non-zero number of steps', () => {
    const { getByText, getAllByTestId } = render(<SetupInstructions />);
    expect(getByText(/Setup Instructions/)).toBeTruthy();
    expect(getAllByTestId(/appclip-setup-step-/).length).toBeGreaterThan(0);
  });

  it('mentions adding an App Clip target in Xcode', () => {
    const { getAllByText } = render(<SetupInstructions />);
    expect(getAllByText(/App Clip target/).length).toBeGreaterThan(0);
  });

  it('mentions the on-demand-install-capable entitlement', () => {
    const { getAllByText } = render(<SetupInstructions />);
    expect(getAllByText(/on-demand-install-capable|App Clip entitlement/).length).toBeGreaterThan(
      0,
    );
  });

  it('mentions hosting the App Clip Experience config / AASA', () => {
    const { getAllByText } = render(<SetupInstructions />);
    expect(
      getAllByText(/App Clip Experience|apple-app-site-association|appclips/i).length,
    ).toBeGreaterThan(0);
  });

  it('mentions TestFlight or App Clip Code testing', () => {
    const { getAllByText } = render(<SetupInstructions />);
    expect(getAllByText(/TestFlight|App Clip Code/).length).toBeGreaterThan(0);
  });

  it('produces a non-empty snapshot', () => {
    const { toJSON } = render(<SetupInstructions />);
    expect(toJSON()).toBeTruthy();
  });
});
