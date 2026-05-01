/**
 * RealityKit USDZ Lab Screen Test (Web)
 * Feature: 062-realitykit-usdz
 */
import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';

describe('RealityKitUsdzScreen (Web)', () => {
  it('renders IOSOnlyBanner', () => {
    const Screen = require('@/modules/062-realitykit-usdz/screen.web').default;
    render(<Screen />);
    expect(screen.getByText(/iOS Only Feature/i)).toBeTruthy();
  });
});
