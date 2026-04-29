/**
 * Tests for IOSOnlyBanner — feature 032 / T031.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';

import IOSOnlyBanner from '@/modules/documents-lab/components/IOSOnlyBanner';

describe('IOSOnlyBanner', () => {
  it('renders message mentioning "iOS-only"', () => {
    render(<IOSOnlyBanner />);
    expect(screen.getByText(/iOS-only/i)).toBeTruthy();
  });

  it('has accessibilityRole="alert"', () => {
    const { toJSON } = render(<IOSOnlyBanner />);
    expect(JSON.stringify(toJSON())).toContain('alert');
  });

  it('renders without crashing', () => {
    const { toJSON } = render(<IOSOnlyBanner />);
    expect(toJSON()).toBeTruthy();
  });
});
