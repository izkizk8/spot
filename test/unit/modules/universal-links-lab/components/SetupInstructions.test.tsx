/**
 * Unit tests: SetupInstructions — Universal Links Lab.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import SetupInstructions from '@/modules/universal-links-lab/components/SetupInstructions';

describe('SetupInstructions', () => {
  it('renders a heading and a non-zero number of steps', () => {
    const { getByText, getAllByTestId } = render(<SetupInstructions />);
    expect(getByText(/Setup Instructions/)).toBeTruthy();
    expect(getAllByTestId(/setup-step-/).length).toBeGreaterThan(0);
  });

  it('mentions hosting AASA at /.well-known/apple-app-site-association', () => {
    const { getAllByText } = render(<SetupInstructions />);
    expect(getAllByText(/\/\.well-known\/apple-app-site-association/).length).toBeGreaterThan(0);
  });

  it('mentions associatedDomains and entitlement / build-time', () => {
    const { getAllByText } = render(<SetupInstructions />);
    expect(getAllByText(/associatedDomains|applinks:/).length).toBeGreaterThan(0);
  });

  it('produces a non-empty snapshot', () => {
    const { toJSON } = render(<SetupInstructions />);
    expect(toJSON()).toBeTruthy();
  });
});
