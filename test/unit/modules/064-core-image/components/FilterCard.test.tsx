/**
 * FilterCard Component Test
 * Feature: 064-core-image
 */
import { render, screen, fireEvent } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';

const FilterCard = require('@/modules/064-core-image/components/FilterCard').default;

describe('FilterCard', () => {
  const defaultProps = {
    filterId: 'sepia' as const,
    params: { intensity: 0.8 },
    loading: false,
    onParamChange: jest.fn(),
    onApply: jest.fn(),
  };

  it('renders filter title', () => {
    render(<FilterCard {...defaultProps} />);
    expect(screen.getByText('Sepia Tone')).toBeTruthy();
  });

  it('renders filter description', () => {
    render(<FilterCard {...defaultProps} />);
    expect(screen.getByText(/sepia-tone/i)).toBeTruthy();
  });

  it('renders CIFilter class name', () => {
    render(<FilterCard {...defaultProps} />);
    expect(screen.getByText('CISepiaTone')).toBeTruthy();
  });

  it('renders "Apply Filter" button', () => {
    render(<FilterCard {...defaultProps} />);
    expect(screen.getByText('Apply Filter')).toBeTruthy();
  });

  it('calls onApply when Apply button is pressed', () => {
    const onApply = jest.fn();
    render(<FilterCard {...defaultProps} onApply={onApply} />);
    fireEvent.press(screen.getByText('Apply Filter'));
    expect(onApply).toHaveBeenCalledTimes(1);
  });

  it('disables Apply button when loading', () => {
    render(<FilterCard {...defaultProps} loading={true} />);
    expect(screen.queryByText('Apply Filter')).toBeNull();
  });

  it('renders param label for sepia intensity', () => {
    render(<FilterCard {...defaultProps} />);
    expect(screen.getByText(/Intensity/i)).toBeTruthy();
  });

  it('renders color-invert with no param rows', () => {
    render(
      <FilterCard
        filterId="color-invert"
        params={{}}
        loading={false}
        onParamChange={jest.fn()}
        onApply={jest.fn()}
      />,
    );
    expect(screen.getByText('Colour Invert')).toBeTruthy();
    expect(screen.getByText('CIColorInvert')).toBeTruthy();
    // No intensity/radius label
    expect(screen.queryByText(/Intensity/i)).toBeNull();
  });

  it('calls onParamChange when decrease button pressed', () => {
    const onParamChange = jest.fn();
    render(<FilterCard {...defaultProps} onParamChange={onParamChange} />);
    fireEvent.press(screen.getByLabelText('Decrease Intensity'));
    expect(onParamChange).toHaveBeenCalledWith('intensity', expect.any(Number));
  });

  it('calls onParamChange when increase button pressed', () => {
    const onParamChange = jest.fn();
    render(<FilterCard {...defaultProps} onParamChange={onParamChange} />);
    fireEvent.press(screen.getByLabelText('Increase Intensity'));
    expect(onParamChange).toHaveBeenCalledWith('intensity', expect.any(Number));
  });
});
