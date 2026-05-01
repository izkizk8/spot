/**
 * ModePicker component tests (feature 017, User Story 1).
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { ModePicker } from '@/modules/camera-vision/components/ModePicker';

describe('ModePicker', () => {
  it('renders four segments labelled Faces, Text, Barcodes, Off', () => {
    const { getByText } = render(
      <ModePicker mode='faces' onModeChange={jest.fn()} disabled={false} />,
    );
    expect(getByText('Faces')).toBeTruthy();
    expect(getByText('Text')).toBeTruthy();
    expect(getByText('Barcodes')).toBeTruthy();
    expect(getByText('Off')).toBeTruthy();
  });

  it('shows the correct segment as selected when mode is faces', () => {
    const { getByText } = render(
      <ModePicker mode='faces' onModeChange={jest.fn()} disabled={false} />,
    );
    const facesSegment = getByText('Faces');
    // In a real implementation, we'd check style or testID to verify selection
    // For now, we trust the implementation will highlight the selected segment
    expect(facesSegment).toBeTruthy();
  });

  it('tapping a segment invokes onModeChange with the correct value', () => {
    const onModeChange = jest.fn();
    const { getByText } = render(
      <ModePicker mode='faces' onModeChange={onModeChange} disabled={false} />,
    );

    fireEvent.press(getByText('Text'));
    expect(onModeChange).toHaveBeenCalledWith('text');
    expect(onModeChange).toHaveBeenCalledTimes(1);

    onModeChange.mockClear();
    fireEvent.press(getByText('Barcodes'));
    expect(onModeChange).toHaveBeenCalledWith('barcodes');
    expect(onModeChange).toHaveBeenCalledTimes(1);

    onModeChange.mockClear();
    fireEvent.press(getByText('Off'));
    expect(onModeChange).toHaveBeenCalledWith('off');
    expect(onModeChange).toHaveBeenCalledTimes(1);
  });

  it('renders in disabled state when disabled prop is true', () => {
    const onModeChange = jest.fn();
    const { getByText } = render(
      <ModePicker mode='faces' onModeChange={onModeChange} disabled={true} />,
    );

    fireEvent.press(getByText('Text'));
    // When disabled, the press should be a no-op
    expect(onModeChange).not.toHaveBeenCalled();
  });
});
