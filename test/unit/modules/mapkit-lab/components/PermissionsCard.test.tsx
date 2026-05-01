import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import {
  PermissionsCard,
  type PermissionStatus,
} from '@/modules/mapkit-lab/components/PermissionsCard';

const ALL_STATUSES: PermissionStatus[] = ['undetermined', 'denied', 'granted', 'restricted'];

describe('PermissionsCard', () => {
  it.each(ALL_STATUSES)('renders the status row for status=%s', (status) => {
    render(<PermissionsCard status={status} onRequest={jest.fn().mockResolvedValue(undefined)} />);

    expect(screen.getByTestId('permissions-status-row')).toBeTruthy();
    expect(screen.getByTestId('permissions-status-value')).toHaveTextContent(status);
  });

  it('enables the request button only when status is undetermined', () => {
    for (const status of ALL_STATUSES) {
      const { unmount } = render(
        <PermissionsCard status={status} onRequest={jest.fn().mockResolvedValue(undefined)} />,
      );

      const button = screen.getByRole('button', { name: /Request when-in-use permission/i });
      const expectedDisabled = status !== 'undetermined';
      expect(button.props.accessibilityState?.disabled).toBe(expectedDisabled);

      unmount();
    }
  });

  it('awaits onRequest when the button is pressed', async () => {
    let resolveFn: (() => void) | undefined;
    const pending = new Promise<void>((resolve) => {
      resolveFn = resolve;
    });
    const onRequest = jest.fn().mockReturnValue(pending);

    render(<PermissionsCard status='undetermined' onRequest={onRequest} />);

    const button = screen.getByRole('button', { name: /Request when-in-use permission/i });
    fireEvent.press(button);

    expect(onRequest).toHaveBeenCalledTimes(1);

    resolveFn?.();
    await pending;
  });

  it('does not call onRequest when the button is disabled', () => {
    const onRequest = jest.fn().mockResolvedValue(undefined);
    render(<PermissionsCard status='denied' onRequest={onRequest} />);

    const button = screen.getByRole('button', { name: /Request when-in-use permission/i });
    fireEvent.press(button);

    expect(onRequest).not.toHaveBeenCalled();
  });
});
