/**
 * IOSOnlyBanner Test
 * Feature: 053-swiftdata
 */

import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';
import { Platform } from 'react-native';

import IOSOnlyBanner from '@/modules/swiftdata-lab/components/IOSOnlyBanner';

describe('IOSOnlyBanner', () => {
  it('renders the iOS Only header', () => {
    render(<IOSOnlyBanner />);
    expect(screen.getByText(/iOS Only Feature/i)).toBeTruthy();
  });

  it('mentions SwiftData and the current platform', () => {
    Platform.OS = 'web';
    render(<IOSOnlyBanner />);
    expect(screen.getByText(/SwiftData/)).toBeTruthy();
    expect(screen.getByText(/Web/)).toBeTruthy();
  });

  it('handles android', () => {
    Platform.OS = 'android';
    render(<IOSOnlyBanner />);
    expect(screen.getByText(/Android/)).toBeTruthy();
  });
});
