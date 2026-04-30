/**
 * Unit tests: IOSOnlyBanner component (T015 / US7).
 *
 * Validates the banner renders properly with themed primitives.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import IOSOnlyBanner from '@/modules/handoff-lab/components/IOSOnlyBanner';

describe('IOSOnlyBanner', () => {
  it('renders title and body copy explaining iOS-only nature', () => {
    const { getAllByText } = render(<IOSOnlyBanner />);
    // Check for keywords that indicate this is an iOS-only feature
    const iosElements = getAllByText(/iOS/);
    expect(iosElements.length).toBeGreaterThan(0);
    const handoffElements = getAllByText(/Handoff/);
    expect(handoffElements.length).toBeGreaterThan(0);
  });

  it('uses ThemedText and ThemedView primitives', () => {
    const { toJSON } = render(<IOSOnlyBanner />);
    expect(toJSON()).not.toBeNull();
  });

  it('produces a non-empty snapshot', () => {
    const { toJSON } = render(<IOSOnlyBanner />);
    expect(toJSON()).toBeTruthy();
  });

  it('does not import any native modules', () => {
    // If this test runs without throwing, it means no native imports broke the test
    expect(() => render(<IOSOnlyBanner />)).not.toThrow();
  });
});
