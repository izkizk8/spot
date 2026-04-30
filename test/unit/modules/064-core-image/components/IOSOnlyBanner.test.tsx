/**
 * IOSOnlyBanner Component Test
 * Feature: 064-core-image
 */
import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';
import { Platform } from 'react-native';

describe('IOSOnlyBanner', () => {
  it('renders iOS Only Feature text', () => {
    const IOSOnlyBanner = require('@/modules/064-core-image/components/IOSOnlyBanner').default;
    render(<IOSOnlyBanner />);
    expect(screen.getByText(/iOS Only Feature/i)).toBeTruthy();
  });

  it('shows "Android" when Platform.OS is android', () => {
    const prev = Platform.OS;
    Platform.OS = 'android';
    const IOSOnlyBanner = require('@/modules/064-core-image/components/IOSOnlyBanner').default;
    render(<IOSOnlyBanner />);
    expect(screen.getByText(/Android/)).toBeTruthy();
    Platform.OS = prev;
  });

  it('shows "Web" when Platform.OS is web', () => {
    const prev = Platform.OS;
    Platform.OS = 'web' as typeof Platform.OS;
    const IOSOnlyBanner = require('@/modules/064-core-image/components/IOSOnlyBanner').default;
    render(<IOSOnlyBanner />);
    expect(screen.getByText(/Web/)).toBeTruthy();
    Platform.OS = prev;
  });
});
