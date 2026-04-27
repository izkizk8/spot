/**
 * T005: ChartTypePicker.test.tsx — US1 control test
 *
 * Tests the chart-type segmented control.
 * Must FAIL before T008 implements the component.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// Import will fail until T008 creates the component
import { ChartTypePicker } from '@/modules/swift-charts-lab/components/ChartTypePicker';

describe('ChartTypePicker', () => {
  it('renders four segments: Line, Bar, Area, Point', () => {
    const fn = jest.fn();
    const { getByText } = render(<ChartTypePicker value="line" onChange={fn} />);

    expect(getByText('Line')).toBeTruthy();
    expect(getByText('Bar')).toBeTruthy();
    expect(getByText('Area')).toBeTruthy();
    expect(getByText('Point')).toBeTruthy();
  });

  it('Line segment is selected by default when value=line', () => {
    const fn = jest.fn();
    const { getByLabelText } = render(<ChartTypePicker value="line" onChange={fn} />);

    const lineSegment = getByLabelText('Chart type: Line');
    expect(lineSegment.props.accessibilityState.selected).toBe(true);
  });

  it('pressing Bar segment calls onChange with "bar"', () => {
    const fn = jest.fn();
    const { getByLabelText } = render(<ChartTypePicker value="line" onChange={fn} />);

    const barSegment = getByLabelText('Chart type: Bar');
    fireEvent.press(barSegment);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('bar');
  });

  it('pressing Area segment calls onChange with "area"', () => {
    const fn = jest.fn();
    const { getByLabelText } = render(<ChartTypePicker value="line" onChange={fn} />);

    const areaSegment = getByLabelText('Chart type: Area');
    fireEvent.press(areaSegment);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('area');
  });

  it('pressing Point segment calls onChange with "point"', () => {
    const fn = jest.fn();
    const { getByLabelText } = render(<ChartTypePicker value="line" onChange={fn} />);

    const pointSegment = getByLabelText('Chart type: Point');
    fireEvent.press(pointSegment);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('point');
  });

  it('updates selected indicator when value changes', () => {
    const fn = jest.fn();
    const { getByLabelText, rerender } = render(<ChartTypePicker value="line" onChange={fn} />);

    let lineSegment = getByLabelText('Chart type: Line');
    let barSegment = getByLabelText('Chart type: Bar');
    expect(lineSegment.props.accessibilityState.selected).toBe(true);
    expect(barSegment.props.accessibilityState.selected).toBe(false);

    // Re-render with bar selected
    rerender(<ChartTypePicker value="bar" onChange={fn} />);

    lineSegment = getByLabelText('Chart type: Line');
    barSegment = getByLabelText('Chart type: Bar');
    expect(lineSegment.props.accessibilityState.selected).toBe(false);
    expect(barSegment.props.accessibilityState.selected).toBe(true);
  });
});
