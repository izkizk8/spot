/**
 * Live Stickers Lab Screen Test (Android)
 * Feature: 083-live-stickers
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';

import Screen from '@/modules/live-stickers-lab/screen.android';

describe('LiveStickersLabScreen (Android)', () => {
  it('renders IOSOnlyBanner', () => {
    const { getByTestId } = render(<Screen />);
    expect(getByTestId('live-stickers-ios-only-banner')).toBeTruthy();
  });

  it('renders the iOS Only Feature title text', () => {
    const { getByText } = render(<Screen />);
    expect(getByText(/iOS Only Feature/i)).toBeTruthy();
  });

  it('no pick photo button present', () => {
    const { queryByTestId } = render(<Screen />);
    expect(queryByTestId('pick-photo-button')).toBeNull();
  });
});
