/**
 * IOSOnlyBanner Component Test
 * Feature: 080-live-text
 */

import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';
import { Platform } from 'react-native';

import IOSOnlyBanner from '@/modules/live-text-lab/components/IOSOnlyBanner';

describe('IOSOnlyBanner (live-text-lab)', () => {
  it('renders the iOS Only Feature title', () => {
    render(<IOSOnlyBanner />);
    expect(screen.getByText(/iOS Only Feature/i)).toBeTruthy();
  });

  it('mentions the current platform when Android', () => {
    Platform.OS = 'android';
    render(<IOSOnlyBanner />);
    expect(screen.getByText(/Android/i)).toBeTruthy();
    Platform.OS = 'ios';
  });

  it('mentions the current platform when Web', () => {
    Platform.OS = 'web';
    render(<IOSOnlyBanner />);
    expect(screen.getByText(/Web/i)).toBeTruthy();
    Platform.OS = 'ios';
  });

  it('renders the warning emoji', () => {
    render(<IOSOnlyBanner />);
    expect(screen.getByText('⚠️')).toBeTruthy();
  });
});
