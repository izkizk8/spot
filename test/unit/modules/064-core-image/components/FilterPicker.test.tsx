/**
 * FilterPicker Component Test
 * Feature: 064-core-image
 */
import { render, screen, fireEvent } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';

const FilterPicker = require('@/modules/064-core-image/components/FilterPicker').default;

describe('FilterPicker', () => {
  it('renders all 6 filter chips', () => {
    const onChange = jest.fn();
    render(<FilterPicker value="sepia" onChange={onChange} />);
    expect(screen.getByText('Sepia Tone')).toBeTruthy();
    expect(screen.getByText('Gaussian Blur')).toBeTruthy();
    expect(screen.getByText('Vignette')).toBeTruthy();
    expect(screen.getByText('Colour Invert')).toBeTruthy();
    expect(screen.getByText('Photo Noir')).toBeTruthy();
    expect(screen.getByText('Sharpen')).toBeTruthy();
  });

  it('renders the "Filter" label', () => {
    render(<FilterPicker value="sepia" onChange={jest.fn()} />);
    expect(screen.getByText(/^Filter$/)).toBeTruthy();
  });

  it('calls onChange when a chip is pressed', () => {
    const onChange = jest.fn();
    render(<FilterPicker value="sepia" onChange={onChange} />);
    fireEvent.press(screen.getByText('Gaussian Blur'));
    expect(onChange).toHaveBeenCalledWith('blur');
  });
});
