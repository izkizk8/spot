/**
 * IOSOnlyBanner Test
 * Feature: 082-pencilkit
 */

import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';
import { Platform } from 'react-native';

import IOSOnlyBanner from '@/modules/pencilkit-lab/components/IOSOnlyBanner';

describe('IOSOnlyBanner', () => {
  it('renders the iOS Only header', () => {
    render(<IOSOnlyBanner />);
    expect(screen.getByText(/iOS Only Feature/i)).toBeTruthy();
  });

  it('mentions PencilKit and the current platform', () => {
    Platform.OS = 'web';
    render(<IOSOnlyBanner />);
    expect(screen.getByText(/PencilKit/)).toBeTruthy();
    expect(screen.getByText(/Web/)).toBeTruthy();
  });

  it('handles android', () => {
    Platform.OS = 'android';
    render(<IOSOnlyBanner />);
    expect(screen.getByText(/Android/)).toBeTruthy();
  });
});
