/**
 * PolicyPicker Test
 * Feature: 082-pencilkit
 */

import { fireEvent, render, screen } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';

import PolicyPicker from '@/modules/pencilkit-lab/components/PolicyPicker';

describe('PolicyPicker', () => {
  it('renders all three policy options', () => {
    render(<PolicyPicker value='default' onChange={jest.fn()} />);
    expect(screen.getAllByText('Default').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Any Input').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pencil Only').length).toBeGreaterThan(0);
  });

  it('marks the active option as selected', () => {
    render(<PolicyPicker value='pencilOnly' onChange={jest.fn()} />);
    const active = screen.getByLabelText('Policy Pencil Only');
    expect(active.props.accessibilityState).toMatchObject({ selected: true });
  });

  it('fires onChange with the chosen policy', () => {
    const onChange = jest.fn();
    render(<PolicyPicker value='default' onChange={onChange} />);
    fireEvent.press(screen.getByLabelText('Policy Any Input'));
    expect(onChange).toHaveBeenCalledWith('anyInput');
  });
});
