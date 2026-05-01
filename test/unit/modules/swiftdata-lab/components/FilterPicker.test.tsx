/**
 * FilterPicker Test
 * Feature: 053-swiftdata
 */

import { fireEvent, render, screen } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';

import FilterPicker from '@/modules/swiftdata-lab/components/FilterPicker';

describe('FilterPicker', () => {
  it('renders all four options', () => {
    render(<FilterPicker value='all' onChange={jest.fn()} />);
    expect(screen.getByText('All')).toBeTruthy();
    expect(screen.getByText('Active')).toBeTruthy();
    expect(screen.getByText('Completed')).toBeTruthy();
    expect(screen.getByText('Today')).toBeTruthy();
  });

  it('marks the active option as selected', () => {
    render(<FilterPicker value='completed' onChange={jest.fn()} />);
    const active = screen.getByLabelText('Filter Completed');
    expect(active.props.accessibilityState).toMatchObject({ selected: true });
  });

  it('fires onChange with the chosen filter', () => {
    const onChange = jest.fn();
    render(<FilterPicker value='all' onChange={onChange} />);
    fireEvent.press(screen.getByText('Today'));
    expect(onChange).toHaveBeenCalledWith('today');
  });
});
