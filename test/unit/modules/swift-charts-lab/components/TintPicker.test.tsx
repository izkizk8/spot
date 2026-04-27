/**
 * T015: TintPicker.test.tsx — US3 tint swatch picker test
 *
 * Tests the four-swatch tint picker with selection indicator.
 * Must FAIL initially until stub is replaced in T017.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TintPicker } from '@/modules/swift-charts-lab/components/TintPicker';
import { TINTS } from '@/modules/swift-charts-lab/data';

describe('TintPicker', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders four swatches for blue, green, orange, purple', () => {
    const { getByLabelText } = render(
      <TintPicker value={TINTS[0]} onChange={mockOnChange} tints={TINTS} />,
    );

    expect(getByLabelText('Tint: blue')).toBeTruthy();
    expect(getByLabelText('Tint: green')).toBeTruthy();
    expect(getByLabelText('Tint: orange')).toBeTruthy();
    expect(getByLabelText('Tint: purple')).toBeTruthy();
  });

  it('blue swatch shows selected indicator when value=TINTS[0]', () => {
    const { getByLabelText } = render(
      <TintPicker value={TINTS[0]} onChange={mockOnChange} tints={TINTS} />,
    );

    const blueSwatch = getByLabelText('Tint: blue');
    expect(blueSwatch.props.accessibilityState.selected).toBe(true);

    const greenSwatch = getByLabelText('Tint: green');
    expect(greenSwatch.props.accessibilityState.selected).toBe(false);
  });

  it('pressing green swatch calls onChange with TINTS[1]', () => {
    const { getByLabelText } = render(
      <TintPicker value={TINTS[0]} onChange={mockOnChange} tints={TINTS} />,
    );

    fireEvent.press(getByLabelText('Tint: green'));
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith(TINTS[1]);
  });

  it('pressing orange swatch calls onChange with TINTS[2]', () => {
    const { getByLabelText } = render(
      <TintPicker value={TINTS[0]} onChange={mockOnChange} tints={TINTS} />,
    );

    fireEvent.press(getByLabelText('Tint: orange'));
    expect(mockOnChange).toHaveBeenCalledWith(TINTS[2]);
  });

  it('pressing purple swatch calls onChange with TINTS[3]', () => {
    const { getByLabelText } = render(
      <TintPicker value={TINTS[0]} onChange={mockOnChange} tints={TINTS} />,
    );

    fireEvent.press(getByLabelText('Tint: purple'));
    expect(mockOnChange).toHaveBeenCalledWith(TINTS[3]);
  });

  it('selected indicator moves when value changes', () => {
    const { getByLabelText, rerender } = render(
      <TintPicker value={TINTS[0]} onChange={mockOnChange} tints={TINTS} />,
    );

    let blueSwatch = getByLabelText('Tint: blue');
    let greenSwatch = getByLabelText('Tint: green');
    expect(blueSwatch.props.accessibilityState.selected).toBe(true);
    expect(greenSwatch.props.accessibilityState.selected).toBe(false);

    // Re-render with green selected
    rerender(<TintPicker value={TINTS[1]} onChange={mockOnChange} tints={TINTS} />);

    blueSwatch = getByLabelText('Tint: blue');
    greenSwatch = getByLabelText('Tint: green');
    expect(blueSwatch.props.accessibilityState.selected).toBe(false);
    expect(greenSwatch.props.accessibilityState.selected).toBe(true);
  });
});
