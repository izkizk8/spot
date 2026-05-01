/**
 * SiriKit Lab Screen Test (Web)
 * Feature: 071-sirikit
 */

import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import React from 'react';

import Screen from '@/modules/sirikit-lab/screen.web';

describe('SiriKitLabScreen (Web)', () => {
  it('renders IOSOnlyBanner', () => {
    render(<Screen />);
    expect(screen.getByText(/iOS Only Feature/i)).toBeTruthy();
  });

  it('no interactive sections present', () => {
    render(<Screen />);
    expect(screen.queryByText(/SiriKit Capability/i)).toBeNull();
  });
});
