/**
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import HomesList from '@/modules/homekit-lab/components/HomesList';
import type { HomeRecord } from '@/native/homekit.types';

const HOMES: readonly HomeRecord[] = [
  { id: 'h1', name: 'Lake Cabin', isPrimary: true, rooms: [] },
  { id: 'h2', name: 'Apartment', isPrimary: false, rooms: [] },
];

describe('HomesList', () => {
  it('renders an empty state when there are no homes', () => {
    const { getByTestId } = render(
      <HomesList homes={[]} selectedHomeId={null} onSelect={() => {}} />,
    );
    expect(getByTestId('homekit-homes-empty')).toBeTruthy();
  });

  it('renders one row per home and a Primary pill on the primary', () => {
    const { getByTestId } = render(
      <HomesList homes={HOMES} selectedHomeId="h1" onSelect={() => {}} />,
    );
    expect(getByTestId('homekit-home-row-h1')).toBeTruthy();
    expect(getByTestId('homekit-home-row-h2')).toBeTruthy();
    expect(getByTestId('homekit-home-primary-h1')).toBeTruthy();
  });

  it('does not render a Primary pill on non-primary homes', () => {
    const { queryByTestId } = render(
      <HomesList homes={HOMES} selectedHomeId="h1" onSelect={() => {}} />,
    );
    expect(queryByTestId('homekit-home-primary-h2')).toBeNull();
  });

  it('invokes onSelect with the row id when a row is pressed', () => {
    const onSelect = jest.fn();
    const { getByTestId } = render(
      <HomesList homes={HOMES} selectedHomeId={null} onSelect={onSelect} />,
    );
    fireEvent.press(getByTestId('homekit-home-row-h2'));
    expect(onSelect).toHaveBeenCalledWith('h2');
  });
});
