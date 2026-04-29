/**
 * PeripheralPanel — unit tests (T022).
 * Feature: 035-core-bluetooth
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import PeripheralPanel from '@/modules/bluetooth-lab/components/PeripheralPanel';
import type { ConnectionState } from '@/native/ble-central.types';

describe('PeripheralPanel', () => {
  const baseProps = {
    peripheralName: 'p',
    peripheralId: 'abcdefgh-extra',
    services: [],
    eventsByCharId: {},
    onDisconnect: jest.fn(),
    onRead: jest.fn(),
    onWrite: jest.fn(),
    onSubscribe: jest.fn(),
    onUnsubscribe: jest.fn(),
    onClearEvents: jest.fn(),
  };

  const states: ConnectionState[] = ['connecting', 'connected', 'disconnecting', 'disconnected'];

  it.each(states)('renders the %s connection pill', (s) => {
    const { getByLabelText } = render(<PeripheralPanel {...baseProps} connectionState={s} />);
    expect(getByLabelText(`connection-${s}`)).toBeTruthy();
  });

  it('renders empty service tree gracefully', () => {
    const { getByText } = render(<PeripheralPanel {...baseProps} connectionState="connected" />);
    expect(getByText(/no services discovered yet/i)).toBeTruthy();
  });

  it('Disconnect calls onDisconnect when connected', () => {
    const onDisconnect = jest.fn();
    const { getByText } = render(
      <PeripheralPanel {...baseProps} onDisconnect={onDisconnect} connectionState="connected" />,
    );
    fireEvent.press(getByText(/disconnect/i));
    expect(onDisconnect).toHaveBeenCalledTimes(1);
  });

  it('Disconnect button is disabled when connectionState === "disconnected"', () => {
    const onDisconnect = jest.fn();
    const { getAllByText } = render(
      <PeripheralPanel {...baseProps} onDisconnect={onDisconnect} connectionState="disconnected" />,
    );
    const [disconnectButton] = getAllByText('Disconnect');
    expect(disconnectButton).toBeTruthy();
    fireEvent.press(disconnectButton);
    expect(onDisconnect).not.toHaveBeenCalled();
  });

  it('renders a ServiceRow for each service', () => {
    const services = [
      { id: 's1', uuid: '180f', isWellKnown: true, characteristics: [] },
      {
        id: 's2',
        uuid: 'beefbabe-1111-2222-3333-444455556666',
        isWellKnown: false,
        characteristics: [],
      },
    ];
    const { getByText } = render(
      <PeripheralPanel {...baseProps} services={services} connectionState="connected" />,
    );
    expect(getByText(/Battery Service/i)).toBeTruthy();
    expect(getByText(/Custom service/i)).toBeTruthy();
  });
});
