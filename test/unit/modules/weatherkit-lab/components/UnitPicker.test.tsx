/**
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import UnitPicker, { UNIT_OPTIONS } from '@/modules/weatherkit-lab/components/UnitPicker';

describe('UnitPicker', () => {
  it('renders a button per unit option', () => {
    const onSelect = jest.fn();
    const { getByTestId } = render(<UnitPicker selected='metric' onSelect={onSelect} />);
    for (const o of UNIT_OPTIONS) {
      expect(getByTestId(`weatherkit-unit-${o.id}`)).toBeTruthy();
    }
  });

  it('marks the selected unit via accessibilityState', () => {
    const onSelect = jest.fn();
    const { getByTestId } = render(<UnitPicker selected='imperial' onSelect={onSelect} />);
    expect(getByTestId('weatherkit-unit-imperial').props.accessibilityState).toEqual({
      selected: true,
    });
    expect(getByTestId('weatherkit-unit-metric').props.accessibilityState).toEqual({
      selected: false,
    });
  });

  it('invokes onSelect with the picked unit', () => {
    const onSelect = jest.fn();
    const { getByTestId } = render(<UnitPicker selected='metric' onSelect={onSelect} />);
    fireEvent.press(getByTestId('weatherkit-unit-scientific'));
    expect(onSelect).toHaveBeenCalledWith('scientific');
  });

  it('exposes exactly three unit options', () => {
    expect(UNIT_OPTIONS).toHaveLength(3);
    expect(UNIT_OPTIONS.map((o) => o.id)).toEqual(['metric', 'imperial', 'scientific']);
  });
});
