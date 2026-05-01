/**
 * IOSOnlyBanner Tests — Feature 071
 */

import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import React from 'react';

import IOSOnlyBanner from '@/modules/sirikit-lab/components/IOSOnlyBanner';

describe('IOSOnlyBanner', () => {
  it('renders the iOS Only Feature title', () => {
    render(<IOSOnlyBanner />);
    expect(screen.getByText(/iOS Only Feature/i)).toBeTruthy();
  });

  it('mentions SiriKit in the message', () => {
    render(<IOSOnlyBanner />);
    expect(screen.getByText(/SiriKit/i)).toBeTruthy();
  });
});
