/**
 * Visual Look Up Lab Screen Test (Android)
 * Feature: 060-visual-look-up
 */

import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';

import Screen from '@/modules/visual-look-up-lab/screen.android';

describe('VisualLookUpLabScreen (Android)', () => {
  it('renders IOSOnlyBanner', () => {
    render(<Screen />);
    expect(screen.getByText(/iOS Only Feature/i)).toBeTruthy();
  });

  it('no interactive sections present', () => {
    render(<Screen />);
    expect(screen.queryByText(/Visual Look Up Capability/i)).toBeNull();
  });
});
