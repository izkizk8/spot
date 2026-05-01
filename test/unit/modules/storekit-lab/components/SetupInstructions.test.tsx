/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import SetupInstructions from '@/modules/storekit-lab/components/SetupInstructions';

describe('SetupInstructions', () => {
  it('renders the setup-instructions test id', () => {
    const { getByTestId } = render(<SetupInstructions />);
    expect(getByTestId('storekit-setup-instructions')).toBeTruthy();
  });

  it('mentions Configuration.storekit and App Store Connect', () => {
    const { getByText, getAllByText } = render(<SetupInstructions />);
    expect(getByText(/Configuration\.storekit/)).toBeTruthy();
    expect(getAllByText(/App Store Connect/i).length).toBeGreaterThan(0);
  });
});
