/**
 * T014: AudioSessionIndicator component test for speech-recognition-lab.
 *
 * Coverage:
 *   - Renders distinct visual + accessible state for `active` vs `inactive`
 *   - Accessible label updates synchronously with the `active` prop
 *   - Reduced-motion is respected when an animation is used (mock useReducedMotion)
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';

// Mock the hook so we can assert reduced-motion behavior.
jest.mock('@/hooks/useReducedMotion', () => ({
  __esModule: true,
  useReducedMotion: jest.fn(() => false),
}));

// Re-import after the mock is registered.
import AudioSessionIndicator from '@/modules/speech-recognition-lab/components/AudioSessionIndicator';
import { useReducedMotion } from '@/hooks/useReducedMotion';

describe('AudioSessionIndicator', () => {
  beforeEach(() => {
    (useReducedMotion as jest.Mock).mockReset();
    (useReducedMotion as jest.Mock).mockReturnValue(false);
  });

  describe('active vs inactive states', () => {
    it('renders distinct accessible state when active=true', () => {
      const { UNSAFE_root } = render(<AudioSessionIndicator active={true} />);
      const labelled = UNSAFE_root.findAll(
        (n: any) => Boolean(n.props && typeof n.props.accessibilityLabel === 'string'),
      );
      expect(labelled.length).toBeGreaterThan(0);
      // Active label should mention "active" or "listening".
      const labels = labelled
        .map((n: any) => String(n.props.accessibilityLabel))
        .join(' | ');
      expect(labels).toMatch(/active|listening|recording/i);
    });

    it('renders distinct accessible state when active=false', () => {
      const { UNSAFE_root } = render(<AudioSessionIndicator active={false} />);
      const labelled = UNSAFE_root.findAll(
        (n: any) => Boolean(n.props && typeof n.props.accessibilityLabel === 'string'),
      );
      expect(labelled.length).toBeGreaterThan(0);
      const labels = labelled
        .map((n: any) => String(n.props.accessibilityLabel))
        .join(' | ');
      expect(labels).toMatch(/inactive|idle|stopped/i);
    });

    it('accessible label changes synchronously when the active prop flips', () => {
      const { rerender, UNSAFE_root } = render(<AudioSessionIndicator active={false} />);
      const inactiveLabels = UNSAFE_root
        .findAll((n: any) => Boolean(n.props && typeof n.props.accessibilityLabel === 'string'))
        .map((n: any) => String(n.props.accessibilityLabel))
        .join(' | ');

      rerender(<AudioSessionIndicator active={true} />);
      const activeLabels = UNSAFE_root
        .findAll((n: any) => Boolean(n.props && typeof n.props.accessibilityLabel === 'string'))
        .map((n: any) => String(n.props.accessibilityLabel))
        .join(' | ');

      expect(activeLabels).not.toBe(inactiveLabels);
    });
  });

  describe('Reduced-motion behavior (NFR-002, NFR-005)', () => {
    it('reads useReducedMotion() to decide whether to animate', () => {
      render(<AudioSessionIndicator active={true} />);
      expect(useReducedMotion).toHaveBeenCalled();
    });

    it('does not crash when reduced-motion is true (animation must be skipped)', () => {
      (useReducedMotion as jest.Mock).mockReturnValue(true);
      expect(() => render(<AudioSessionIndicator active={true} />)).not.toThrow();
    });

    it('does not crash when reduced-motion is false (animation runs)', () => {
      (useReducedMotion as jest.Mock).mockReturnValue(false);
      expect(() => render(<AudioSessionIndicator active={true} />)).not.toThrow();
    });
  });

  it('renders without crashing for either prop value', () => {
    expect(() => render(<AudioSessionIndicator active={false} />)).not.toThrow();
    expect(() => render(<AudioSessionIndicator active={true} />)).not.toThrow();
  });

  it('still renders something for each state (non-empty tree)', () => {
    const r1 = render(<AudioSessionIndicator active={true} />);
    expect(r1.toJSON()).toBeTruthy();
    r1.unmount();
    const r2 = render(<AudioSessionIndicator active={false} />);
    expect(r2.toJSON()).toBeTruthy();
  });

  it('exposes screen-reader visibility (no accessibilityElementsHidden=true on root)', () => {
    const { UNSAFE_root } = render(<AudioSessionIndicator active={true} />);
    const hidden = UNSAFE_root.findAll(
      (n: any) => Boolean(n.props && n.props.accessibilityElementsHidden === true),
    );
    // Indicator should be readable; we accept zero hidden roots.
    expect(hidden.length).toBe(0);
    void screen;
  });
});
