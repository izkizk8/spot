/**
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import AccessoriesList from '@/modules/homekit-lab/components/AccessoriesList';
import type { AccessoryRecord } from '@/native/homekit.types';

const ACCESSORIES: readonly AccessoryRecord[] = [
  {
    id: 'a1',
    homeId: 'h1',
    roomId: 'r1',
    roomName: 'Living Room',
    name: 'Lamp',
    reachable: true,
    characteristics: [
      { id: 'c1', serviceId: 's1', name: 'Power', kind: 'bool', writable: true },
      { id: 'c2', serviceId: 's1', name: 'Brightness', kind: 'percent', writable: true },
    ],
  },
  {
    id: 'a2',
    homeId: 'h1',
    roomId: 'r2',
    roomName: 'Kitchen',
    name: 'Thermostat',
    reachable: false,
    characteristics: [],
  },
];

describe('AccessoriesList', () => {
  it('renders an empty state when no accessories are present', () => {
    const { getByTestId } = render(
      <AccessoriesList
        accessories={[]}
        selectedRoomId={null}
        selectedAccessoryId={null}
        selectedCharacteristicId={null}
        onSelectAccessory={() => {}}
        onSelectCharacteristic={() => {}}
      />,
    );
    expect(getByTestId('homekit-accessories-empty')).toBeTruthy();
  });

  it('filters by selectedRoomId when set', () => {
    const { getByTestId, queryByTestId } = render(
      <AccessoriesList
        accessories={ACCESSORIES}
        selectedRoomId="r1"
        selectedAccessoryId={null}
        selectedCharacteristicId={null}
        onSelectAccessory={() => {}}
        onSelectCharacteristic={() => {}}
      />,
    );
    expect(getByTestId('homekit-accessory-a1')).toBeTruthy();
    expect(queryByTestId('homekit-accessory-a2')).toBeNull();
  });

  it('renders all accessories when selectedRoomId is null', () => {
    const { getByTestId } = render(
      <AccessoriesList
        accessories={ACCESSORIES}
        selectedRoomId={null}
        selectedAccessoryId={null}
        selectedCharacteristicId={null}
        onSelectAccessory={() => {}}
        onSelectCharacteristic={() => {}}
      />,
    );
    expect(getByTestId('homekit-accessory-a1')).toBeTruthy();
    expect(getByTestId('homekit-accessory-a2')).toBeTruthy();
  });

  it('expands characteristic rows only for the selected accessory', () => {
    const { getByTestId, queryByTestId } = render(
      <AccessoriesList
        accessories={ACCESSORIES}
        selectedRoomId={null}
        selectedAccessoryId="a1"
        selectedCharacteristicId={null}
        onSelectAccessory={() => {}}
        onSelectCharacteristic={() => {}}
      />,
    );
    expect(getByTestId('homekit-characteristic-row-c1')).toBeTruthy();
    expect(getByTestId('homekit-characteristic-row-c2')).toBeTruthy();
    // Other accessory characteristics not rendered.
    expect(queryByTestId('homekit-characteristics-empty-a1')).toBeNull();
  });

  it('shows an empty hint for selected accessories with no characteristics', () => {
    const { getByTestId } = render(
      <AccessoriesList
        accessories={ACCESSORIES}
        selectedRoomId={null}
        selectedAccessoryId="a2"
        selectedCharacteristicId={null}
        onSelectAccessory={() => {}}
        onSelectCharacteristic={() => {}}
      />,
    );
    expect(getByTestId('homekit-characteristics-empty-a2')).toBeTruthy();
  });

  it('invokes the right callback when a row is pressed', () => {
    const onSelectAccessory = jest.fn();
    const onSelectCharacteristic = jest.fn();
    const { getByTestId } = render(
      <AccessoriesList
        accessories={ACCESSORIES}
        selectedRoomId={null}
        selectedAccessoryId="a1"
        selectedCharacteristicId={null}
        onSelectAccessory={onSelectAccessory}
        onSelectCharacteristic={onSelectCharacteristic}
      />,
    );
    fireEvent.press(getByTestId('homekit-accessory-row-a1'));
    expect(onSelectAccessory).toHaveBeenCalledWith('a1');
    fireEvent.press(getByTestId('homekit-characteristic-row-c2'));
    expect(onSelectCharacteristic).toHaveBeenCalledWith('c2');
  });
});
