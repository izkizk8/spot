/**
 * Unit tests: IOSOnlyBanner — App Clips Lab.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import IOSOnlyBanner from '@/modules/app-clips-lab/components/IOSOnlyBanner';

describe('IOSOnlyBanner (App Clips Lab)', () => {
  it('mentions iOS and App Clips', () => {
    const { getAllByText } = render(<IOSOnlyBanner />);
    expect(getAllByText(/iOS/).length).toBeGreaterThan(0);
    expect(getAllByText(/App Clips/).length).toBeGreaterThan(0);
  });

  it('uses the documented testID', () => {
    const { getByTestId } = render(<IOSOnlyBanner />);
    expect(getByTestId('app-clips-ios-only-banner')).toBeTruthy();
  });

  it('mentions the 10MB size constraint', () => {
    const { getAllByText } = render(<IOSOnlyBanner />);
    expect(getAllByText(/10MB/).length).toBeGreaterThan(0);
  });

  it('produces a non-empty snapshot', () => {
    const { toJSON } = render(<IOSOnlyBanner />);
    expect(toJSON()).toBeTruthy();
  });
});
