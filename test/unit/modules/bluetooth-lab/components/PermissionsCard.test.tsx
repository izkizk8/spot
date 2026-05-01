/**
 * PermissionsCard — unit tests (T018).
 * Feature: 035-core-bluetooth
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import PermissionsCard from '@/modules/bluetooth-lab/components/PermissionsCard';
import type { PermissionStatus } from '@/native/ble-central.types';

describe('PermissionsCard', () => {
  const states: PermissionStatus[] = [
    'granted',
    'denied',
    'undetermined',
    'restricted',
    'notApplicable',
  ];

  it.each(states)('renders the %s status pill', (s) => {
    const { getByLabelText } = render(<PermissionsCard status={s} onRequest={jest.fn()} />);
    expect(getByLabelText(`permission-${s}`)).toBeTruthy();
  });

  it('Request button calls onRequest', () => {
    const onRequest = jest.fn();
    const { getByText } = render(<PermissionsCard status='undetermined' onRequest={onRequest} />);
    fireEvent.press(getByText(/request/i));
    expect(onRequest).toHaveBeenCalledTimes(1);
  });

  it('Open Settings affordance only on denied / restricted', () => {
    const { queryByText: q1 } = render(<PermissionsCard status='granted' onRequest={jest.fn()} />);
    expect(q1(/open settings/i)).toBeNull();

    const { getByText: g2 } = render(<PermissionsCard status='denied' onRequest={jest.fn()} />);
    expect(g2(/open settings/i)).toBeTruthy();

    const { getByText: g3 } = render(<PermissionsCard status='restricted' onRequest={jest.fn()} />);
    expect(g3(/open settings/i)).toBeTruthy();
  });
});
