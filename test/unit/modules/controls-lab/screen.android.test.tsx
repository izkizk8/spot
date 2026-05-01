/**
 * Controls Lab Screen Test (Android)
 * Feature: 087-controls
 */
import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';

import Screen from '@/modules/controls-lab/screen.android';

describe('ControlsLabScreen (Android)', () => {
  it('renders IOSOnlyBanner', () => {
    render(<Screen />);
    expect(screen.getByText(/iOS Only Feature/i)).toBeTruthy();
  });

  it('no interactive sections present', () => {
    render(<Screen />);
    expect(screen.queryByText(/Controls Capability/i)).toBeNull();
  });
});
