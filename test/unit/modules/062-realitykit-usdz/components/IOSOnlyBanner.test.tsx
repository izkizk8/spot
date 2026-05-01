/**
 * IOSOnlyBanner Component Tests
 * Feature: 062-realitykit-usdz
 */
import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';
import { Platform } from 'react-native';

import IOSOnlyBanner from '@/modules/062-realitykit-usdz/components/IOSOnlyBanner';

describe('IOSOnlyBanner', () => {
  it('renders title and message', () => {
    render(<IOSOnlyBanner />);
    expect(screen.getByText(/iOS Only Feature/i)).toBeTruthy();
    expect(screen.getByText(/RealityKit USDZ AR preview is iOS only/i)).toBeTruthy();
  });

  it('mentions Android when on Android', () => {
    Platform.OS = 'android';
    render(<IOSOnlyBanner />);
    expect(screen.getByText(/Android/i)).toBeTruthy();
    Platform.OS = 'ios';
  });

  it('accepts a style prop', () => {
    expect(() => render(<IOSOnlyBanner style={{ margin: 8 }} />)).not.toThrow();
  });
});
