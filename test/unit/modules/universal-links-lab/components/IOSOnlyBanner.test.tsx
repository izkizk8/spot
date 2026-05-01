/**
 * Unit tests: IOSOnlyBanner — Universal Links Lab.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import IOSOnlyBanner from '@/modules/universal-links-lab/components/IOSOnlyBanner';

describe('IOSOnlyBanner (Universal Links Lab)', () => {
  it('mentions iOS and Universal Links', () => {
    const { getAllByText } = render(<IOSOnlyBanner />);
    expect(getAllByText(/iOS/).length).toBeGreaterThan(0);
    expect(getAllByText(/Universal Links/).length).toBeGreaterThan(0);
  });

  it('uses the documented testID', () => {
    const { getByTestId } = render(<IOSOnlyBanner />);
    expect(getByTestId('universal-links-ios-only-banner')).toBeTruthy();
  });

  it('produces a non-empty snapshot', () => {
    const { toJSON } = render(<IOSOnlyBanner />);
    expect(toJSON()).toBeTruthy();
  });
});
