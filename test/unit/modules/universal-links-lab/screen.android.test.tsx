/**
 * Unit tests: universal-links-lab Android screen.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import UniversalLinksLabAndroid from '@/modules/universal-links-lab/screen.android';

describe('universal-links-lab screen (Android)', () => {
  it('renders only the IOSOnlyBanner', () => {
    const { getByTestId, queryByText } = render(<UniversalLinksLabAndroid />);
    expect(getByTestId('universal-links-ios-only-banner')).toBeTruthy();
    expect(queryByText(/About Universal Links/)).toBeNull();
    expect(queryByText(/AASA Preview/)).toBeNull();
  });
});
