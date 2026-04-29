/**
 * Tests for IOSOnlyBanner — feature 031 / T027.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';

import IOSOnlyBanner from '@/modules/spotlight-lab/components/IOSOnlyBanner';

describe('IOSOnlyBanner', () => {
  it('renders the default "Spotlight indexing requires iOS 9+" copy', () => {
    render(<IOSOnlyBanner />);
    expect(screen.getByText(/Spotlight.*iOS 9/i)).toBeTruthy();
  });

  it('renders alternative "system-disabled" copy variant (FR-013 / EC-002)', () => {
    render(<IOSOnlyBanner reason="system-disabled" />);
    expect(screen.getByText(/disabled|unavailable/i)).toBeTruthy();
  });

  it('renders without crashing on Android / Web', () => {
    const { toJSON } = render(<IOSOnlyBanner />);
    expect(toJSON()).toBeTruthy();
  });

  it('has accessibilityRole="alert" for screen readers', () => {
    render(<IOSOnlyBanner />);
    // The root element should have role alert for accessibility
    const { toJSON } = render(<IOSOnlyBanner />);
    expect(JSON.stringify(toJSON())).toContain('alert');
  });
});
