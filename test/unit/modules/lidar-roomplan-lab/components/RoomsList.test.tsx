/**
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import RoomsList from '@/modules/lidar-roomplan-lab/components/RoomsList';
import type { ScannedRoom } from '@/modules/lidar-roomplan-lab/room-store';

const sample: ScannedRoom = {
  id: 'r-1',
  name: 'Office',
  dimensions: { widthM: 3, lengthM: 4, heightM: 2.5 },
  surfaces: { walls: 4, windows: 2, doors: 1, openings: 1, objects: 6 },
  createdAt: '2026-05-12T00:00:00.000Z',
  usdzPath: null,
};

describe('RoomsList', () => {
  it('renders the empty state when there are no rooms', () => {
    const { getByTestId } = render(
      <RoomsList rooms={[]} selectedRoomId={null} onSelect={() => {}} onDelete={() => {}} />,
    );
    expect(getByTestId('roomplan-rooms-list')).toBeTruthy();
    expect(getByTestId('roomplan-rooms-empty')).toBeTruthy();
  });

  it('renders one row per room', () => {
    const r2: ScannedRoom = { ...sample, id: 'r-2', name: 'Kitchen' };
    const { getByTestId, queryByTestId } = render(
      <RoomsList
        rooms={[sample, r2]}
        selectedRoomId={null}
        onSelect={() => {}}
        onDelete={() => {}}
      />,
    );
    expect(getByTestId('roomplan-room-r-1')).toBeTruthy();
    expect(getByTestId('roomplan-room-r-2')).toBeTruthy();
    expect(queryByTestId('roomplan-rooms-empty')).toBeNull();
  });

  it('invokes onSelect with the room id', () => {
    const onSelect = jest.fn();
    const { getByTestId } = render(
      <RoomsList rooms={[sample]} selectedRoomId={null} onSelect={onSelect} onDelete={() => {}} />,
    );
    fireEvent.press(getByTestId('roomplan-select-room-r-1'));
    expect(onSelect).toHaveBeenCalledWith('r-1');
  });

  it('invokes onDelete with the room id', () => {
    const onDelete = jest.fn();
    const { getByTestId } = render(
      <RoomsList rooms={[sample]} selectedRoomId={null} onSelect={() => {}} onDelete={onDelete} />,
    );
    fireEvent.press(getByTestId('roomplan-delete-room-r-1'));
    expect(onDelete).toHaveBeenCalledWith('r-1');
  });

  it('marks the selected row via accessibilityState', () => {
    const { getByTestId } = render(
      <RoomsList rooms={[sample]} selectedRoomId='r-1' onSelect={() => {}} onDelete={() => {}} />,
    );
    const row = getByTestId('roomplan-select-room-r-1');
    expect(row.props.accessibilityState).toEqual(expect.objectContaining({ selected: true }));
  });
});
