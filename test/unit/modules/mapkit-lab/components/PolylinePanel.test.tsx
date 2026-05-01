import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { PolylinePanel } from '@/modules/mapkit-lab/components/PolylinePanel';

function renderPanel(overrides: Partial<React.ComponentProps<typeof PolylinePanel>> = {}) {
  const props = {
    hasPolyline: false,
    onDraw: jest.fn(),
    onClear: jest.fn(),
    ...overrides,
  };
  const utils = render(<PolylinePanel {...props} />);
  return { ...utils, props };
}

describe('PolylinePanel', () => {
  it('calls onDraw when "Draw sample loop" is pressed', () => {
    const { props } = renderPanel();
    fireEvent.press(screen.getByTestId('polyline-draw-button'));
    expect(props.onDraw).toHaveBeenCalledTimes(1);
  });

  it('disables Clear when hasPolyline is false and does not invoke onClear', () => {
    const { props } = renderPanel({ hasPolyline: false });
    const clear = screen.getByTestId('polyline-clear-button');
    expect(clear.props.accessibilityState?.disabled).toBe(true);
    fireEvent.press(clear);
    expect(props.onClear).not.toHaveBeenCalled();
  });

  it('enables Clear and calls onClear when hasPolyline is true', () => {
    const { props } = renderPanel({ hasPolyline: true });
    const clear = screen.getByTestId('polyline-clear-button');
    expect(clear.props.accessibilityState?.disabled).toBe(false);
    fireEvent.press(clear);
    expect(props.onClear).toHaveBeenCalledTimes(1);
  });
});
