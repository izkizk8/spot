/**
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import RoomsList from '@/modules/homekit-lab/components/RoomsList';
import type { HomeRecord } from '@/native/homekit.types';

const HOME: HomeRecord = {
  id: 'h1',
  name: 'Lake Cabin',
  isPrimary: true,
  rooms: [
    { id: 'r1', name: 'Living Room' },
    { id: 'r2', name: 'Kitchen' },
  ],
};

describe('RoomsList', () => {
  it('renders an empty state when no home is selected', () => {
    const { getByTestId } = render(
      <RoomsList home={null} selectedRoomId={null} onSelect={() => {}} />,
    );
    expect(getByTestId('homekit-rooms-empty')).toBeTruthy();
  });

  it('renders an empty state when the home has no rooms', () => {
    const empty: HomeRecord = { ...HOME, rooms: [] };
    const { getByTestId } = render(
      <RoomsList home={empty} selectedRoomId={null} onSelect={() => {}} />,
    );
    expect(getByTestId('homekit-rooms-empty')).toBeTruthy();
  });

  it('renders an "All rooms" row plus one row per room', () => {
    const { getByTestId } = render(
      <RoomsList home={HOME} selectedRoomId={null} onSelect={() => {}} />,
    );
    expect(getByTestId('homekit-room-row-all')).toBeTruthy();
    expect(getByTestId('homekit-room-row-r1')).toBeTruthy();
    expect(getByTestId('homekit-room-row-r2')).toBeTruthy();
  });

  it('invokes onSelect with the room id when pressed', () => {
    const onSelect = jest.fn();
    const { getByTestId } = render(
      <RoomsList home={HOME} selectedRoomId={null} onSelect={onSelect} />,
    );
    fireEvent.press(getByTestId('homekit-room-row-r2'));
    expect(onSelect).toHaveBeenCalledWith('r2');
    fireEvent.press(getByTestId('homekit-room-row-all'));
    expect(onSelect).toHaveBeenLastCalledWith(null);
  });
});
