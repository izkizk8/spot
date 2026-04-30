/**
 * @jest-environment jsdom
 */

import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';

import RoomDetailView from '@/modules/lidar-roomplan-lab/components/RoomDetailView';
import type { ScannedRoom } from '@/modules/lidar-roomplan-lab/room-store';

const sample: ScannedRoom = {
  id: 'r-1',
  name: 'Office',
  dimensions: { widthM: 3, lengthM: 4, heightM: 2.5 },
  surfaces: { walls: 4, windows: 2, doors: 1, openings: 1, objects: 6 },
  createdAt: '2026-05-12T00:00:00.000Z',
  usdzPath: null,
};

describe('RoomDetailView', () => {
  it('renders the empty state when no room is selected', () => {
    const { getByTestId } = render(<RoomDetailView room={null} />);
    expect(getByTestId('roomplan-room-detail-empty')).toBeTruthy();
  });

  it('renders metric dimensions', () => {
    const { getByTestId } = render(<RoomDetailView room={sample} />);
    const node = getByTestId('roomplan-detail-dimensions');
    const text = Array.isArray(node.props.children)
      ? node.props.children.join('')
      : String(node.props.children);
    expect(text).toMatch(/3\.00 m/);
    expect(text).toMatch(/4\.00 m/);
    expect(text).toMatch(/2\.50 m/);
  });

  it('renders imperial dimensions', () => {
    const { getByTestId } = render(<RoomDetailView room={sample} />);
    const node = getByTestId('roomplan-detail-imperial');
    const text = Array.isArray(node.props.children)
      ? node.props.children.join('')
      : String(node.props.children);
    expect(text).toMatch(/′/);
    expect(text).toMatch(/″/);
  });

  it('renders surface counts per category', () => {
    const { getByTestId } = render(<RoomDetailView room={sample} />);
    expect(JSON.stringify(getByTestId('roomplan-detail-walls').props.children)).toMatch(/4/);
    expect(JSON.stringify(getByTestId('roomplan-detail-windows').props.children)).toMatch(/2/);
    expect(JSON.stringify(getByTestId('roomplan-detail-doors').props.children)).toMatch(/1/);
    expect(JSON.stringify(getByTestId('roomplan-detail-openings').props.children)).toMatch(/1/);
    expect(JSON.stringify(getByTestId('roomplan-detail-objects').props.children)).toMatch(/6/);
  });

  it('renders the "Not exported yet" notice when usdzPath is null', () => {
    const { getByTestId } = render(<RoomDetailView room={sample} />);
    const node = getByTestId('roomplan-detail-usdz-path');
    expect(JSON.stringify(node.props.children)).toMatch(/Not exported/);
  });

  it('renders the persisted USDZ path when present', () => {
    const exported: ScannedRoom = { ...sample, usdzPath: 'file:///tmp/x.usdz' };
    const { getByTestId } = render(<RoomDetailView room={exported} />);
    const node = getByTestId('roomplan-detail-usdz-path');
    expect(JSON.stringify(node.props.children)).toMatch(/file:\/\/\/tmp\/x\.usdz/);
  });

  it('renders the exportSlot when provided', () => {
    const slot = <Text testID="custom-export-slot">EXPORT</Text>;
    const { getByTestId } = render(<RoomDetailView room={sample} exportSlot={slot} />);
    expect(getByTestId('custom-export-slot')).toBeTruthy();
  });
});
