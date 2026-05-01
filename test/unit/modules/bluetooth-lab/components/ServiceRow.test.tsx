/**
 * ServiceRow — unit tests (T023).
 * Feature: 035-core-bluetooth
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import ServiceRow from '@/modules/bluetooth-lab/components/ServiceRow';

describe('ServiceRow', () => {
  const baseProps = {
    eventsByCharId: {},
    onRead: jest.fn(),
    onWrite: jest.fn(),
    onSubscribe: jest.fn(),
    onUnsubscribe: jest.fn(),
    onClearEvents: jest.fn(),
  };

  it('renders the SIG-known label when matched', () => {
    const { getByText } = render(
      <ServiceRow
        {...baseProps}
        service={{ id: 's', uuid: '180f', isWellKnown: true, characteristics: [] }}
      />,
    );
    expect(getByText(/Battery Service/)).toBeTruthy();
  });

  it('renders Custom service caption + raw UUID when not in catalog', () => {
    const { getByText } = render(
      <ServiceRow
        {...baseProps}
        service={{
          id: 's',
          uuid: 'beefbabe-1111-2222-3333-444455556666',
          isWellKnown: false,
          characteristics: [],
        }}
      />,
    );
    expect(getByText(/Custom service/)).toBeTruthy();
    expect(getByText('beefbabe-1111-2222-3333-444455556666')).toBeTruthy();
  });

  it('renders one CharacteristicRow per child', () => {
    const { getAllByText } = render(
      <ServiceRow
        {...baseProps}
        service={{
          id: 's',
          uuid: '180f',
          isWellKnown: true,
          characteristics: [
            { id: 'c1', uuid: '2a19', serviceId: 's', properties: ['read'], isSubscribed: false },
          ],
        }}
      />,
    );
    expect(getAllByText(/Battery Level/i).length).toBeGreaterThan(0);
  });

  it('toggles expanded state', () => {
    const { getByRole } = render(
      <ServiceRow
        {...baseProps}
        service={{
          id: 's',
          uuid: '180f',
          isWellKnown: true,
          characteristics: [],
        }}
      />,
    );
    const button = getByRole('button');
    expect(button.props.accessibilityState?.expanded).toBe(true);
    fireEvent.press(button);
    expect(button.props.accessibilityState?.expanded).toBe(false);
  });
});
