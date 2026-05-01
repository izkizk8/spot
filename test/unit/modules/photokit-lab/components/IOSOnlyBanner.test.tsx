/**
 * IOSOnlyBanner Test
 * Feature: 057-photokit
 */

import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';
import { Platform } from 'react-native';

import IOSOnlyBanner from '@/modules/photokit-lab/components/IOSOnlyBanner';

describe('IOSOnlyBanner', () => {
  it('renders the iOS Only header', () => {
    render(<IOSOnlyBanner />);
    expect(screen.getByText(/iOS Only Feature/i)).toBeTruthy();
  });

  it('mentions PHPickerViewController and the current platform', () => {
    Platform.OS = 'web';
    render(<IOSOnlyBanner />);
    expect(screen.getByText(/PHPickerViewController/)).toBeTruthy();
    expect(screen.getByText(/Web/)).toBeTruthy();
  });

  it('handles android', () => {
    Platform.OS = 'android';
    render(<IOSOnlyBanner />);
    expect(screen.getByText(/Android/)).toBeTruthy();
  });
});
