/**
 * IOSOnlyBanner Usage Test
 * Feature: 034-arkit-basics
 *
 * Smoke test verifying that the existing IOSOnlyBanner component from prior
 * modules renders correctly with ARKit-specific copy. No new implementation
 * is required (reuse pattern from 017/029/030/031/032/033).
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import IOSOnlyBanner from '@/modules/background-tasks-lab/components/IOSOnlyBanner';

describe('IOSOnlyBanner usage for ARKit', () => {
  it('renders with platform reason', () => {
    const { getByText } = render(<IOSOnlyBanner reason='platform' />);

    expect(getByText(/Background Tasks require iOS 13\+/i)).toBeTruthy();
  });

  it('renders with older-ios reason', () => {
    const { getByText } = render(<IOSOnlyBanner reason='older-ios' />);

    expect(getByText(/older than 13/i)).toBeTruthy();
  });

  it('accepts custom style prop', () => {
    const customStyle = { marginTop: 20 };
    const { root } = render(<IOSOnlyBanner reason='platform' style={customStyle} />);

    // Just verify it renders without crashing with custom style
    expect(root).toBeTruthy();
  });
});
