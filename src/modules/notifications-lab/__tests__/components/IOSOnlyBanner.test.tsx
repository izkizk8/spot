/**
 * Test for IOSOnlyBanner component (feature 026).
 *
 * Validates that per-reason copy renders for all 6 reasons.
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { IOSOnlyBanner } from '../../components/IOSOnlyBanner';

describe('IOSOnlyBanner', () => {
  const reasons = [
    'permissions',
    'categories',
    'pending',
    'delivered',
    'compose-fields',
    'web-fallback',
  ] as const;

  it.each(reasons)('renders copy for reason: %s', (reason) => {
    const { getByText } = render(<IOSOnlyBanner reason={reason} />);

    // Should render some text content (non-empty)
    const element = getByText(/.+/);
    expect(element).toBeTruthy();
  });

  it('renders unique copy for each reason', () => {
    const copies = reasons.map((reason) => {
      const { container } = render(<IOSOnlyBanner reason={reason} />);
      return container.props.children;
    });

    // Each copy should be unique (no duplicates)
    const uniqueCopies = new Set(copies.map(JSON.stringify));
    expect(uniqueCopies.size).toBe(reasons.length);
  });

  it('renders non-empty copy for all reasons', () => {
    reasons.forEach((reason) => {
      const { getByText } = render(<IOSOnlyBanner reason={reason} />);
      const element = getByText(/.+/);

      // Verify text is not empty
      expect(element.props.children).toBeTruthy();
      expect(element.props.children.length).toBeGreaterThan(0);
    });
  });
});
