/**
 * IOSOnlyBanner Test
 * Feature: 070-icloud-drive
 */

import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';
import { Platform } from 'react-native';

import IOSOnlyBanner from '@/modules/icloud-drive-lab/components/IOSOnlyBanner';

describe('IOSOnlyBanner', () => {
  it('renders the iOS Only header', () => {
    render(<IOSOnlyBanner />);
    expect(screen.getByText(/iOS Only Feature/i)).toBeTruthy();
  });

  it('mentions iCloud Drive and the current platform', () => {
    Platform.OS = 'web';
    render(<IOSOnlyBanner />);
    expect(screen.getByText(/iCloud Drive/)).toBeTruthy();
    expect(screen.getByText(/Web/)).toBeTruthy();
  });

  it('handles android', () => {
    Platform.OS = 'android';
    render(<IOSOnlyBanner />);
    expect(screen.getByText(/Android/)).toBeTruthy();
  });
});
