/**
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import AuthorizationCard from '@/modules/healthkit-lab/components/AuthorizationCard';
import {
  type AuthStatus,
  type HealthSampleId,
  SAMPLE_IDS,
} from '@/modules/healthkit-lab/sample-types';

function makeMap(status: AuthStatus): Readonly<Record<HealthSampleId, AuthStatus>> {
  const out: Record<HealthSampleId, AuthStatus> = {
    steps: status,
    heartRate: status,
    sleep: status,
    workouts: status,
    weight: status,
  };
  return out;
}

describe('AuthorizationCard', () => {
  it('renders one row per SAMPLE_IDS entry', () => {
    const { getByTestId } = render(
      <AuthorizationCard
        authStatusByType={makeMap('undetermined')}
        initialised={false}
        available={null}
        onRequest={() => {}}
      />,
    );
    for (const id of SAMPLE_IDS) {
      expect(getByTestId(`healthkit-auth-row-${id}`)).toBeTruthy();
    }
  });

  it('shows the "Request access" CTA before init and "Re-request" after', () => {
    const { rerender, getByTestId, getByText } = render(
      <AuthorizationCard
        authStatusByType={makeMap('undetermined')}
        initialised={false}
        available={null}
        onRequest={() => {}}
      />,
    );
    expect(getByText('Request access')).toBeTruthy();

    rerender(
      <AuthorizationCard
        authStatusByType={makeMap('authorized')}
        initialised
        available
        onRequest={() => {}}
      />,
    );
    expect(getByText('Re-request access')).toBeTruthy();
    expect(getByTestId('healthkit-request-access')).toBeTruthy();
  });

  it('invokes onRequest when the CTA is pressed', () => {
    const onRequest = jest.fn();
    const { getByTestId } = render(
      <AuthorizationCard
        authStatusByType={makeMap('undetermined')}
        initialised={false}
        available={null}
        onRequest={onRequest}
      />,
    );
    fireEvent.press(getByTestId('healthkit-request-access'));
    expect(onRequest).toHaveBeenCalledTimes(1);
  });

  it('shows the unavailable banner when available is false', () => {
    const { getByTestId } = render(
      <AuthorizationCard
        authStatusByType={makeMap('undetermined')}
        initialised={false}
        available={false}
        onRequest={() => {}}
      />,
    );
    expect(getByTestId('healthkit-unavailable')).toBeTruthy();
  });

  it('does not show the unavailable banner when available is null or true', () => {
    const { queryByTestId, rerender } = render(
      <AuthorizationCard
        authStatusByType={makeMap('undetermined')}
        initialised={false}
        available={null}
        onRequest={() => {}}
      />,
    );
    expect(queryByTestId('healthkit-unavailable')).toBeNull();

    rerender(
      <AuthorizationCard
        authStatusByType={makeMap('authorized')}
        initialised
        available
        onRequest={() => {}}
      />,
    );
    expect(queryByTestId('healthkit-unavailable')).toBeNull();
  });
});
