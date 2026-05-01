/**
 * SiriKit Lab Screen Test (Android)
 * Feature: 071-sirikit
 */

import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import React from 'react';

import Screen from '@/modules/sirikit-lab/screen.android';

describe('SiriKitLabScreen (Android)', () => {
  it('renders IOSOnlyBanner', () => {
    render(<Screen />);
    expect(screen.getByText(/iOS Only Feature/i)).toBeTruthy();
  });

  it('no interactive sections present', () => {
    render(<Screen />);
    expect(screen.queryByText(/SiriKit Capability/i)).toBeNull();
  });
});
