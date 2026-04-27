/**
 * T011: DataControls.test.tsx — US2 dataset mutation controls test
 *
 * Tests the Randomize/Add/Remove buttons plus gradient toggle.
 * Must FAIL initially until stub is replaced with real implementation in T013.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { DataControls } from '@/modules/swift-charts-lab/components/DataControls';

describe('DataControls', () => {
  const mockProps = {
    onRandomize: jest.fn(),
    onAdd: jest.fn(),
    addDisabled: false,
    onRemove: jest.fn(),
    removeDisabled: false,
    gradientEnabled: false,
    onToggleGradient: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders four controls: Randomize, Add point, Remove point, Show foreground style', () => {
    const { getByLabelText } = render(<DataControls {...mockProps} />);

    expect(getByLabelText('Randomize data')).toBeTruthy();
    expect(getByLabelText('Add point')).toBeTruthy();
    expect(getByLabelText('Remove point')).toBeTruthy();
    expect(getByLabelText(/Show foreground style/)).toBeTruthy();
  });

  it('pressing Randomize calls onRandomize', () => {
    const { getByLabelText } = render(<DataControls {...mockProps} />);

    fireEvent.press(getByLabelText('Randomize data'));
    expect(mockProps.onRandomize).toHaveBeenCalledTimes(1);
  });

  it('pressing Add point calls onAdd', () => {
    const { getByLabelText } = render(<DataControls {...mockProps} />);

    fireEvent.press(getByLabelText('Add point'));
    expect(mockProps.onAdd).toHaveBeenCalledTimes(1);
  });

  it('pressing Remove point calls onRemove', () => {
    const { getByLabelText } = render(<DataControls {...mockProps} />);

    fireEvent.press(getByLabelText('Remove point'));
    expect(mockProps.onRemove).toHaveBeenCalledTimes(1);
  });

  it('pressing Show foreground style toggle calls onToggleGradient', () => {
    const { getByLabelText } = render(<DataControls {...mockProps} />);

    fireEvent.press(getByLabelText('Show foreground style off'));
    expect(mockProps.onToggleGradient).toHaveBeenCalledTimes(1);
  });

  it('Add point button reports disabled state when addDisabled=true', () => {
    const { getByLabelText } = render(<DataControls {...mockProps} addDisabled={true} />);

    const addButton = getByLabelText('Add point');
    expect(addButton.props.accessibilityState.disabled).toBe(true);

    fireEvent.press(addButton);
    expect(mockProps.onAdd).not.toHaveBeenCalled();
  });

  it('Remove point button reports disabled state when removeDisabled=true', () => {
    const { getByLabelText } = render(<DataControls {...mockProps} removeDisabled={true} />);

    const removeButton = getByLabelText('Remove point');
    expect(removeButton.props.accessibilityState.disabled).toBe(true);

    fireEvent.press(removeButton);
    expect(mockProps.onRemove).not.toHaveBeenCalled();
  });

  it('gradient toggle shows "on" when gradientEnabled=true', () => {
    const { getByLabelText } = render(<DataControls {...mockProps} gradientEnabled={true} />);

    const toggle = getByLabelText('Show foreground style on');
    expect(toggle.props.accessibilityState.checked).toBe(true);
  });

  it('gradient toggle shows "off" when gradientEnabled=false', () => {
    const { getByLabelText } = render(<DataControls {...mockProps} gradientEnabled={false} />);

    const toggle = getByLabelText('Show foreground style off');
    expect(toggle.props.accessibilityState.checked).toBe(false);
  });
});
