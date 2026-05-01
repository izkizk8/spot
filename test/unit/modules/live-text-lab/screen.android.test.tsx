/**
 * Live Text Lab Screen Test (Android)
 * Feature: 080-live-text
 */

import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';

import Screen from '@/modules/live-text-lab/screen.android';

describe('LiveTextLabScreen (Android)', () => {
  it('renders IOSOnlyBanner', () => {
    render(<Screen />);
    expect(screen.getByText(/iOS Only Feature/i)).toBeTruthy();
  });

  it('no interactive sections present', () => {
    render(<Screen />);
    expect(screen.queryByText(/Live Text Capability/i)).toBeNull();
  });
});
