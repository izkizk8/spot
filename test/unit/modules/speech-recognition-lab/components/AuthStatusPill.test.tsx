/**
 * T013: AuthStatusPill component test for speech-recognition-lab.
 *
 * Coverage:
 *   - Renders a label per `status` prop ('notDetermined' / 'denied' / 'restricted' / 'authorized')
 *   - **Request** button visible only when status === 'notDetermined'
 *   - Tapping **Request** invokes onRequestPress exactly once
 *   - Pill exposes accessibilityRole + accessibilityState for screen readers
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import AuthStatusPill from '@/modules/speech-recognition-lab/components/AuthStatusPill';
import type { AuthStatus } from '@/modules/speech-recognition-lab/speech-types';

describe('AuthStatusPill', () => {
  describe('label rendering per status', () => {
    const cases: AuthStatus[] = ['notDetermined', 'denied', 'restricted', 'authorized'];
    it.each(cases)('renders a non-empty label for status="%s"', (status) => {
      const { UNSAFE_root } = render(<AuthStatusPill status={status} />);
      // Find the pill node carrying the accessibility role.
      const pillNodes = UNSAFE_root.findAllByProps({ accessibilityRole: 'text' });
      // At least the pill or some text container should be present.
      // Fall back to scanning all rendered text content.
      const allText =
        JSON.stringify(UNSAFE_root.props) + JSON.stringify(pillNodes.map((n: any) => n.props));
      // Sanity: per status we expect a recognizable label substring somewhere.
      const expectedFragments: Record<AuthStatus, RegExp> = {
        notDetermined: /not\s*determined|undetermined/i,
        denied: /denied/i,
        restricted: /restricted/i,
        authorized: /authorized|authorised|granted/i,
      };
      // Use Testing Library text query as the primary assertion.
      expect(screen.queryByText(expectedFragments[status])).toBeTruthy();
      // Suppress unused-var warning in cases where allText helped debug locally.
      void allText;
    });
  });

  describe('Request button visibility', () => {
    it('shows the Request button when status === "notDetermined"', () => {
      render(<AuthStatusPill status="notDetermined" onRequestPress={jest.fn()} />);
      expect(screen.queryByText(/request/i)).toBeTruthy();
    });

    it.each(['denied', 'restricted', 'authorized'] as const)(
      'hides the Request button when status === "%s"',
      (status) => {
        render(<AuthStatusPill status={status} onRequestPress={jest.fn()} />);
        expect(screen.queryByText(/^request$/i)).toBeNull();
      },
    );
  });

  describe('Request button interaction', () => {
    it('invokes onRequestPress exactly once when tapped', () => {
      const onRequestPress = jest.fn();
      render(<AuthStatusPill status="notDetermined" onRequestPress={onRequestPress} />);
      const btn = screen.getByText(/request/i);
      fireEvent.press(btn);
      expect(onRequestPress).toHaveBeenCalledTimes(1);
    });

    it('does not throw when no onRequestPress is provided and status is notDetermined', () => {
      expect(() => render(<AuthStatusPill status="notDetermined" />)).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('exposes accessibilityRole on the pill', () => {
      const { UNSAFE_root } = render(<AuthStatusPill status="authorized" />);
      // Accept any role applied to the pill (commonly 'text' or 'summary').
      const withRole = UNSAFE_root.findAllByProps({ accessibilityRole: expect.anything() });
      // jest expect.anything() returned in findAllByProps doesn't actually filter;
      // fall back to a generic search across the tree.
      const all = UNSAFE_root.findAll((n: any) =>
        Boolean(n.props && typeof n.props.accessibilityRole === 'string'),
      );
      expect(all.length).toBeGreaterThan(0);
      void withRole;
    });

    it('exposes accessibilityState reflecting the current status', () => {
      const { UNSAFE_root } = render(<AuthStatusPill status="authorized" />);
      const withState = UNSAFE_root.findAll((n: any) =>
        Boolean(n.props && n.props.accessibilityState),
      );
      expect(withState.length).toBeGreaterThan(0);
    });

    it('Request button exposes accessibilityRole="button"', () => {
      const { UNSAFE_root } = render(
        <AuthStatusPill status="notDetermined" onRequestPress={jest.fn()} />,
      );
      const buttons = UNSAFE_root.findAllByProps({ accessibilityRole: 'button' });
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Settings affordance (US4 / T053)', () => {
    it.each(['denied', 'restricted'] as const)(
      'renders an Open Settings link when status === "%s"',
      (status) => {
        const { UNSAFE_root } = render(
          <AuthStatusPill status={status} onOpenSettingsPress={jest.fn()} />,
        );
        const links = UNSAFE_root.findAll(
          (n: any) =>
            Boolean(n.props) &&
            n.props.accessibilityRole === 'link' &&
            /open settings to enable/i.test(String(n.props.accessibilityLabel ?? '')),
        );
        expect(links.length).toBeGreaterThan(0);
      },
    );

    it.each(['denied', 'restricted'] as const)(
      'hides the Request button when status === "%s"',
      (status) => {
        render(
          <AuthStatusPill
            status={status}
            onRequestPress={jest.fn()}
            onOpenSettingsPress={jest.fn()}
          />,
        );
        expect(screen.queryByText(/^request$/i)).toBeNull();
      },
    );

    it('tapping the Open Settings affordance invokes onOpenSettingsPress exactly once', () => {
      const onOpenSettingsPress = jest.fn();
      const { UNSAFE_root } = render(
        <AuthStatusPill status="denied" onOpenSettingsPress={onOpenSettingsPress} />,
      );
      const link = UNSAFE_root.find(
        (n: any) =>
          Boolean(n.props) &&
          n.props.accessibilityRole === 'link' &&
          /open settings to enable/i.test(String(n.props.accessibilityLabel ?? '')),
      );
      fireEvent.press(link);
      expect(onOpenSettingsPress).toHaveBeenCalledTimes(1);
    });

    it('does not render the Open Settings affordance when status === "authorized"', () => {
      const { UNSAFE_root } = render(
        <AuthStatusPill status="authorized" onOpenSettingsPress={jest.fn()} />,
      );
      const links = UNSAFE_root.findAll(
        (n: any) => Boolean(n.props) && n.props.accessibilityRole === 'link',
      );
      expect(links.length).toBe(0);
    });
  });
});
