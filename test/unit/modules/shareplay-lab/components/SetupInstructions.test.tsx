/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import SetupInstructions from '@/modules/shareplay-lab/components/SetupInstructions';

describe('SetupInstructions', () => {
  it('renders with the expected testID', () => {
    const { getByTestId } = render(<SetupInstructions />);
    expect(getByTestId('shareplay-setup-instructions')).toBeTruthy();
  });

  it('mentions FaceTime, the SharePlay menu and Messages', () => {
    const { getAllByText } = render(<SetupInstructions />);
    expect(getAllByText(/FaceTime/).length).toBeGreaterThan(0);
    expect(getAllByText(/SharePlay menu/).length).toBeGreaterThan(0);
    expect(getAllByText(/Messages/).length).toBeGreaterThan(0);
  });
});
