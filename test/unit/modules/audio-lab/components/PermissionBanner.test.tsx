/**
 * T028 [US1]: PermissionBanner component tests (FR-027 / FR-028).
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import PermissionBanner from '@/modules/audio-lab/components/PermissionBanner';

function findRequestButton(root: any) {
  return root.findAll(
    (n: any) =>
      n.props &&
      n.props.accessibilityRole === 'button' &&
      String(n.props.accessibilityLabel ?? '') === 'Request microphone permission',
  )[0];
}

function findAlert(root: any) {
  return root.findAll((n: any) => n.props && n.props.accessibilityRole === 'alert')[0];
}

describe('PermissionBanner', () => {
  it('renders nothing when status === granted', () => {
    const view = render(
      <PermissionBanner status='granted' onRequestPermission={() => undefined} />,
    );
    expect(view.toJSON()).toBeNull();
  });

  it('renders nothing when status === undetermined', () => {
    const view = render(
      <PermissionBanner status='undetermined' onRequestPermission={() => undefined} />,
    );
    expect(view.toJSON()).toBeNull();
  });

  it('renders the banner with the request button when status === denied', () => {
    const view = render(<PermissionBanner status='denied' onRequestPermission={() => undefined} />);
    expect(view.toJSON()).not.toBeNull();
    expect(findAlert(view.UNSAFE_root)).toBeTruthy();
    expect(findRequestButton(view.UNSAFE_root)).toBeTruthy();
  });

  it('tapping the request button invokes onRequestPermission exactly once', () => {
    const onRequest = jest.fn();
    const view = render(<PermissionBanner status='denied' onRequestPermission={onRequest} />);
    fireEvent.press(findRequestButton(view.UNSAFE_root));
    expect(onRequest).toHaveBeenCalledTimes(1);
  });

  it('the alert region carries an accessibilityLabel', () => {
    const view = render(<PermissionBanner status='denied' onRequestPermission={() => undefined} />);
    const alert = findAlert(view.UNSAFE_root);
    expect(String(alert.props.accessibilityLabel)).toMatch(/permission/i);
  });
});
