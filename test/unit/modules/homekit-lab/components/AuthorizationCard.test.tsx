/**
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import AuthorizationCard from '@/modules/homekit-lab/components/AuthorizationCard';

describe('AuthorizationCard (homekit)', () => {
  it('renders a status row with the current label', () => {
    const { getByTestId } = render(
      <AuthorizationCard
        authStatus="notDetermined"
        initialised={false}
        available={null}
        onRequest={() => {}}
      />,
    );
    expect(getByTestId('homekit-auth-row')).toBeTruthy();
    expect(getByTestId('homekit-auth-status').props.children).toBe('Not determined');
  });

  it('shows "Request access" before init and "Re-request" after', () => {
    const { rerender, getByText } = render(
      <AuthorizationCard
        authStatus="notDetermined"
        initialised={false}
        available={null}
        onRequest={() => {}}
      />,
    );
    expect(getByText('Request access')).toBeTruthy();

    rerender(
      <AuthorizationCard authStatus="authorized" initialised available onRequest={() => {}} />,
    );
    expect(getByText('Re-request access')).toBeTruthy();
  });

  it('invokes onRequest when CTA is pressed', () => {
    const onRequest = jest.fn();
    const { getByTestId } = render(
      <AuthorizationCard
        authStatus="notDetermined"
        initialised={false}
        available={null}
        onRequest={onRequest}
      />,
    );
    fireEvent.press(getByTestId('homekit-request-access'));
    expect(onRequest).toHaveBeenCalledTimes(1);
  });

  it('shows the unavailable hint when available=false', () => {
    const { getByTestId } = render(
      <AuthorizationCard
        authStatus="restricted"
        initialised
        available={false}
        onRequest={() => {}}
      />,
    );
    expect(getByTestId('homekit-unavailable')).toBeTruthy();
  });

  it('does not show unavailable hint when available is null/true', () => {
    const { queryByTestId, rerender } = render(
      <AuthorizationCard
        authStatus="authorized"
        initialised
        available={null}
        onRequest={() => {}}
      />,
    );
    expect(queryByTestId('homekit-unavailable')).toBeNull();
    rerender(
      <AuthorizationCard authStatus="authorized" initialised available onRequest={() => {}} />,
    );
    expect(queryByTestId('homekit-unavailable')).toBeNull();
  });
});
