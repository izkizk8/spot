/**
 * CharacteristicRow — unit tests (T024).
 * Feature: 035-core-bluetooth
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import CharacteristicRow from '@/modules/bluetooth-lab/components/CharacteristicRow';
import type { DiscoveredCharacteristic } from '@/native/ble-central.types';

function makeChar(
  props: DiscoveredCharacteristic['properties'],
  isSubscribed = false,
): DiscoveredCharacteristic {
  return {
    id: 'c1',
    uuid: '2a19',
    serviceId: 's1',
    properties: props,
    isSubscribed,
  };
}

const baseProps = {
  events: [],
  onRead: jest.fn(),
  onWrite: jest.fn(),
  onSubscribe: jest.fn(),
  onUnsubscribe: jest.fn(),
  onClearEvents: jest.fn(),
};

describe('CharacteristicRow', () => {
  it('renders property pills', () => {
    const { getByLabelText } = render(
      <CharacteristicRow {...baseProps} characteristic={makeChar(['read', 'notify'])} />,
    );
    expect(getByLabelText('prop-read')).toBeTruthy();
    expect(getByLabelText('prop-notify')).toBeTruthy();
  });

  it('Read button is disabled when "read" is absent', () => {
    const onRead = jest.fn();
    const { getByText } = render(
      <CharacteristicRow {...baseProps} onRead={onRead} characteristic={makeChar(['notify'])} />,
    );
    fireEvent.press(getByText('Read'));
    expect(onRead).not.toHaveBeenCalled();
  });

  it('Read button calls onRead when "read" is present', () => {
    const onRead = jest.fn();
    const { getByText } = render(
      <CharacteristicRow {...baseProps} onRead={onRead} characteristic={makeChar(['read'])} />,
    );
    fireEvent.press(getByText('Read'));
    expect(onRead).toHaveBeenCalledWith('c1');
  });

  it('shows subscribed indicator when isSubscribed', () => {
    const { getByLabelText } = render(
      <CharacteristicRow {...baseProps} characteristic={makeChar(['notify'], true)} />,
    );
    expect(getByLabelText('subscribed')).toBeTruthy();
  });

  it('Write button validates hex via bytes-utils', () => {
    const onWrite = jest.fn();
    const { getByText, getByLabelText } = render(
      <CharacteristicRow {...baseProps} onWrite={onWrite} characteristic={makeChar(['write'])} />,
    );
    fireEvent.changeText(getByLabelText('write-hex-input'), 'zz');
    fireEvent.press(getByText('Write'));
    expect(onWrite).not.toHaveBeenCalled();
    fireEvent.changeText(getByLabelText('write-hex-input'), '01ab');
    fireEvent.press(getByText('Write'));
    expect(onWrite).toHaveBeenCalledTimes(1);
    expect(onWrite.mock.calls[0][0]).toBe('c1');
    expect(Array.from(onWrite.mock.calls[0][1] as Uint8Array)).toEqual([0x01, 0xab]);
  });
});
