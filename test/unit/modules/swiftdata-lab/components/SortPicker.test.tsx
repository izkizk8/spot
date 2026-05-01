/**
 * SortPicker Test
 * Feature: 053-swiftdata
 */

import { fireEvent, render, screen } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';

import SortPicker from '@/modules/swiftdata-lab/components/SortPicker';

describe('SortPicker', () => {
  it('renders all three options', () => {
    render(<SortPicker value='created' onChange={jest.fn()} />);
    expect(screen.getByText('Created')).toBeTruthy();
    expect(screen.getByText('Priority')).toBeTruthy();
    expect(screen.getByText('Due date')).toBeTruthy();
  });

  it('marks the active option as selected', () => {
    render(<SortPicker value='priority' onChange={jest.fn()} />);
    const active = screen.getByLabelText('Sort by Priority');
    expect(active.props.accessibilityState).toMatchObject({ selected: true });
  });

  it('fires onChange with the chosen sort', () => {
    const onChange = jest.fn();
    render(<SortPicker value='created' onChange={onChange} />);
    fireEvent.press(screen.getByText('Due date'));
    expect(onChange).toHaveBeenCalledWith('dueDate');
  });
});
