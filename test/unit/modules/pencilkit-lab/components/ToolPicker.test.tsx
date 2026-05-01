/**
 * ToolPicker Test
 * Feature: 082-pencilkit
 */

import { fireEvent, render, screen } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';

import ToolPicker from '@/modules/pencilkit-lab/components/ToolPicker';

describe('ToolPicker', () => {
  it('renders all six tool options', () => {
    render(<ToolPicker value='pen' onChange={jest.fn()} />);
    expect(screen.getAllByText('Pen').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pencil').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Marker').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Crayon').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Eraser').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Lasso').length).toBeGreaterThan(0);
  });

  it('marks the active option as selected', () => {
    render(<ToolPicker value='marker' onChange={jest.fn()} />);
    const active = screen.getByLabelText('Tool Marker');
    expect(active.props.accessibilityState).toMatchObject({ selected: true });
  });

  it('fires onChange with the chosen tool', () => {
    const onChange = jest.fn();
    render(<ToolPicker value='pen' onChange={onChange} />);
    fireEvent.press(screen.getByLabelText('Tool Eraser'));
    expect(onChange).toHaveBeenCalledWith('eraser');
  });
});
