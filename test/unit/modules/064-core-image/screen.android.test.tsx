/**
 * CoreImage Lab Screen Test (Android)
 * Feature: 064-core-image
 */
import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';

describe('CoreImageLabScreen (Android)', () => {
  it('renders IOSOnlyBanner', () => {
    const Screen = require('@/modules/064-core-image/screen.android').default;
    render(<Screen />);
    expect(screen.getByText(/iOS Only Feature/i)).toBeTruthy();
  });
});
