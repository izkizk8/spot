/**
 * ConfigurationCard Test
 * Feature: 034-arkit-basics
 *
 * Tests plane detection segmented control, capability-gated switches,
 * disabled state on non-iOS, and Reset button.
 */

import React from 'react';
import { Platform } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import ConfigurationCard from '@/modules/arkit-lab/components/ConfigurationCard';
import type { ARKitConfiguration } from '@/native/arkit.types';

describe('ConfigurationCard', () => {
  const mockConfig: ARKitConfiguration = {
    planeDetection: 'horizontal',
    peopleOcclusion: false,
    lightEstimation: true,
    worldMapPersistence: false,
  };

  const mockOnChange = jest.fn();
  const mockOnReset = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'ios';
  });

  it('renders four plane detection modes from catalog', () => {
    const { getByText } = render(
      <ConfigurationCard
        config={mockConfig}
        peopleOcclusionSupported={true}
        onChange={mockOnChange}
        onReset={mockOnReset}
      />,
    );

    expect(getByText('None')).toBeTruthy();
    expect(getByText('Horizontal')).toBeTruthy();
    expect(getByText('Vertical')).toBeTruthy();
    expect(getByText('Both')).toBeTruthy();
  });

  it('calls onChange with new planeDetection on segment tap', () => {
    const { getByText } = render(
      <ConfigurationCard
        config={mockConfig}
        peopleOcclusionSupported={true}
        onChange={mockOnChange}
        onReset={mockOnReset}
      />,
    );

    fireEvent.press(getByText('Vertical'));

    expect(mockOnChange).toHaveBeenCalledWith({
      planeDetection: 'vertical',
    });
  });

  it('renders peopleOcclusion switch when supported', () => {
    const { getByText } = render(
      <ConfigurationCard
        config={mockConfig}
        peopleOcclusionSupported={true}
        onChange={mockOnChange}
        onReset={mockOnReset}
      />,
    );

    expect(getByText(/people occlusion/i)).toBeTruthy();
  });

  it('renders disabled peopleOcclusion row when not supported', () => {
    const { getByText, getByLabelText } = render(
      <ConfigurationCard
        config={mockConfig}
        peopleOcclusionSupported={false}
        onChange={mockOnChange}
        onReset={mockOnReset}
      />,
    );

    expect(getByText(/people occlusion/i)).toBeTruthy();
    const row = getByLabelText(/people occlusion/i);
    expect(row.props.accessibilityState?.disabled).toBe(true);
  });

  it('calls onChange when lightEstimation switch toggles', () => {
    const { getByLabelText } = render(
      <ConfigurationCard
        config={mockConfig}
        peopleOcclusionSupported={true}
        onChange={mockOnChange}
        onReset={mockOnReset}
      />,
    );

    const switchEl = getByLabelText(/light estimation/i);
    fireEvent(switchEl, 'valueChange', false);

    expect(mockOnChange).toHaveBeenCalledWith({
      lightEstimation: false,
    });
  });

  it('calls onChange when worldMapPersistence switch toggles', () => {
    const { getByLabelText } = render(
      <ConfigurationCard
        config={mockConfig}
        peopleOcclusionSupported={true}
        onChange={mockOnChange}
        onReset={mockOnReset}
      />,
    );

    const switchEl = getByLabelText(/world map persistence/i);
    fireEvent(switchEl, 'valueChange', true);

    expect(mockOnChange).toHaveBeenCalledWith({
      worldMapPersistence: true,
    });
  });

  it('calls onReset when Reset button pressed', () => {
    const { getByText } = render(
      <ConfigurationCard
        config={mockConfig}
        peopleOcclusionSupported={true}
        onChange={mockOnChange}
        onReset={mockOnReset}
      />,
    );

    fireEvent.press(getByText(/reset/i));

    expect(mockOnReset).toHaveBeenCalledTimes(1);
  });

  it('entire card is disabled on Android with explanatory caption', () => {
    Platform.OS = 'android';

    const { getByText, getByLabelText } = render(
      <ConfigurationCard
        config={mockConfig}
        peopleOcclusionSupported={true}
        onChange={mockOnChange}
        onReset={mockOnReset}
      />,
    );

    const card = getByLabelText(/configuration/i);
    expect(card.props.accessibilityState?.disabled).toBe(true);
    expect(getByText(/iOS only/i)).toBeTruthy();
  });

  it('entire card is disabled on Web with explanatory caption', () => {
    Platform.OS = 'web';

    const { getByText, getByLabelText } = render(
      <ConfigurationCard
        config={mockConfig}
        peopleOcclusionSupported={true}
        onChange={mockOnChange}
        onReset={mockOnReset}
      />,
    );

    const card = getByLabelText(/configuration/i);
    expect(card.props.accessibilityState?.disabled).toBe(true);
    expect(getByText(/iOS only/i)).toBeTruthy();
  });
});
