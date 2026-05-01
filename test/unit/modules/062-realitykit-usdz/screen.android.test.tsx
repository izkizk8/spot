/**
 * RealityKit USDZ Lab Screen Test (Android)
 * Feature: 062-realitykit-usdz
 */
import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';

describe('RealityKitUsdzScreen (Android)', () => {
  it('renders IOSOnlyBanner', () => {
    const Screen = require('@/modules/062-realitykit-usdz/screen.android').default;
    render(<Screen />);
    expect(screen.getByText(/iOS Only Feature/i)).toBeTruthy();
  });
});
