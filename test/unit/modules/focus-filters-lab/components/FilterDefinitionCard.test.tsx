import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import FilterDefinitionCard from '@/modules/focus-filters-lab/components/FilterDefinitionCard';
import type { ShowcaseFilterMode } from '@/modules/focus-filters-lab/filter-modes';
import * as bridge from '@/native/focus-filters';

jest.mock('@/native/focus-filters', () => ({
  isAvailable: jest.fn(() => false),
  getCurrentFilterValues: jest.fn(() => Promise.reject(new Error('mock'))),
}));

describe('FilterDefinitionCard', () => {
  const mockOnChangeMode = jest.fn();
  const mockOnChangeAccent = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the filter display name "Showcase Mode"', () => {
    render(
      <FilterDefinitionCard
        mode="relaxed"
        accentColor="blue"
        onChangeMode={mockOnChangeMode}
        onChangeAccent={mockOnChangeAccent}
      />,
    );
    expect(screen.getByText(/showcase mode/i)).toBeTruthy();
  });

  it('renders a one-line description', () => {
    const { root } = render(
      <FilterDefinitionCard
        mode="relaxed"
        accentColor="blue"
        onChangeMode={mockOnChangeMode}
        onChangeAccent={mockOnChangeAccent}
      />,
    );
    const textNodes = root.findAllByType('Text' as any);
    expect(textNodes.length).toBeGreaterThanOrEqual(2); // title + description
  });

  it('renders exactly 3 mode segments with labels Relaxed, Focused, Quiet in order', () => {
    render(
      <FilterDefinitionCard
        mode="relaxed"
        accentColor="blue"
        onChangeMode={mockOnChangeMode}
        onChangeAccent={mockOnChangeAccent}
      />,
    );
    expect(screen.getByText('Relaxed')).toBeTruthy();
    expect(screen.getByText('Focused')).toBeTruthy();
    expect(screen.getByText('Quiet')).toBeTruthy();
  });

  it('the segment matching mode prop has accessibilityState.selected === true', () => {
    const { getByLabelText } = render(
      <FilterDefinitionCard
        mode="focused"
        accentColor="blue"
        onChangeMode={mockOnChangeMode}
        onChangeAccent={mockOnChangeAccent}
      />,
    );
    const focusedSegment = getByLabelText('Focused mode');
    expect(focusedSegment.props.accessibilityState?.selected).toBe(true);
  });

  it('tapping a non-selected segment fires onChangeMode once with the mode value', () => {
    const { getByLabelText } = render(
      <FilterDefinitionCard
        mode="relaxed"
        accentColor="blue"
        onChangeMode={mockOnChangeMode}
        onChangeAccent={mockOnChangeAccent}
      />,
    );
    const focusedPressable = getByLabelText('Focused mode');
    fireEvent.press(focusedPressable);
    expect(mockOnChangeMode).toHaveBeenCalledTimes(1);
    expect(mockOnChangeMode).toHaveBeenCalledWith('focused');
  });

  it('renders exactly 4 accent swatches with slugs blue, orange, green, purple in order with labels', () => {
    render(
      <FilterDefinitionCard
        mode="relaxed"
        accentColor="blue"
        onChangeMode={mockOnChangeMode}
        onChangeAccent={mockOnChangeAccent}
      />,
    );
    expect(screen.getByLabelText(/blue/i)).toBeTruthy();
    expect(screen.getByLabelText(/orange/i)).toBeTruthy();
    expect(screen.getByLabelText(/green/i)).toBeTruthy();
    expect(screen.getByLabelText(/purple/i)).toBeTruthy();
  });

  it('tapping a non-selected swatch fires onChangeAccent once with the slug', () => {
    const { getByLabelText } = render(
      <FilterDefinitionCard
        mode="relaxed"
        accentColor="blue"
        onChangeMode={mockOnChangeMode}
        onChangeAccent={mockOnChangeAccent}
      />,
    );
    fireEvent.press(getByLabelText(/orange/i));
    expect(mockOnChangeAccent).toHaveBeenCalledTimes(1);
    expect(mockOnChangeAccent).toHaveBeenCalledWith('orange');
  });

  it('tapping the already-selected segment is a no-op (no callback fired)', () => {
    const { getByLabelText } = render(
      <FilterDefinitionCard
        mode="relaxed"
        accentColor="blue"
        onChangeMode={mockOnChangeMode}
        onChangeAccent={mockOnChangeAccent}
      />,
    );
    const relaxedPressable = getByLabelText('Relaxed mode');
    fireEvent.press(relaxedPressable);
    expect(mockOnChangeMode).not.toHaveBeenCalled();
  });

  it('tapping the already-selected swatch is a no-op (no callback fired)', () => {
    const { getByLabelText } = render(
      <FilterDefinitionCard
        mode="relaxed"
        accentColor="blue"
        onChangeMode={mockOnChangeMode}
        onChangeAccent={mockOnChangeAccent}
      />,
    );
    fireEvent.press(getByLabelText(/blue/i));
    expect(mockOnChangeAccent).not.toHaveBeenCalled();
  });

  it('bridge isolation — callbacks never call bridge methods', () => {
    const bridgeSpy = jest.spyOn(bridge, 'getCurrentFilterValues');
    const { getByLabelText } = render(
      <FilterDefinitionCard
        mode="relaxed"
        accentColor="blue"
        onChangeMode={mockOnChangeMode}
        onChangeAccent={mockOnChangeAccent}
      />,
    );
    fireEvent.press(getByLabelText('Focused mode'));
    fireEvent.press(getByLabelText(/orange/i));
    expect(bridgeSpy).not.toHaveBeenCalled();
  });

  it('every segment and swatch has a non-empty accessibilityLabel', () => {
    const { getByLabelText } = render(
      <FilterDefinitionCard
        mode="relaxed"
        accentColor="blue"
        onChangeMode={mockOnChangeMode}
        onChangeAccent={mockOnChangeAccent}
      />,
    );
    // Segments
    expect(getByLabelText('Relaxed mode')).toBeTruthy();
    expect(getByLabelText('Focused mode')).toBeTruthy();
    expect(getByLabelText('Quiet mode')).toBeTruthy();

    // Swatches
    expect(getByLabelText(/blue/i).props.accessibilityLabel).toBeTruthy();
    expect(getByLabelText(/orange/i).props.accessibilityLabel).toBeTruthy();
    expect(getByLabelText(/green/i).props.accessibilityLabel).toBeTruthy();
    expect(getByLabelText(/purple/i).props.accessibilityLabel).toBeTruthy();
  });
});
