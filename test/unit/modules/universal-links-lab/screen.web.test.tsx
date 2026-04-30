/**
 * Unit tests: universal-links-lab Web screen.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import UniversalLinksLabWeb from '@/modules/universal-links-lab/screen.web';

describe('universal-links-lab screen (Web)', () => {
  it('renders only the IOSOnlyBanner', () => {
    const { getByTestId, queryByText } = render(<UniversalLinksLabWeb />);
    expect(getByTestId('universal-links-ios-only-banner')).toBeTruthy();
    expect(queryByText(/About Universal Links/)).toBeNull();
    expect(queryByText(/AASA Preview/)).toBeNull();
  });
});
