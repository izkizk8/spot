/**
 * Tap to Pay Lab Screen Test (Web)
 * Feature: 051-tap-to-pay
 */

import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';

import Screen from '@/modules/tap-to-pay-lab/screen.web';

describe('TapToPayLabScreen (Web)', () => {
  it('renders IOSOnlyBanner', () => {
    render(<Screen />);
    expect(screen.getByText(/iOS Only Feature/i)).toBeTruthy();
  });

  it('no interactive sections present', () => {
    render(<Screen />);
    expect(screen.queryByText(/Capability Check/i)).toBeNull();
  });
});
