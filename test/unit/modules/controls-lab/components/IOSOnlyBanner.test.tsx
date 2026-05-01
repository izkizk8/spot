/**
 * IOSOnlyBanner Test
 * Feature: 087-controls
 */
import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';

import IOSOnlyBanner from '@/modules/controls-lab/components/IOSOnlyBanner';

describe('IOSOnlyBanner (controls-lab)', () => {
  it('renders the iOS Only Feature heading', () => {
    render(<IOSOnlyBanner />);
    expect(screen.getByText(/iOS Only Feature/i)).toBeTruthy();
  });

  it('mentions Control Center in the message', () => {
    render(<IOSOnlyBanner />);
    expect(screen.getByText(/Control Center/i)).toBeTruthy();
  });
});
