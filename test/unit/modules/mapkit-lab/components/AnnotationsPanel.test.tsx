import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import {
  AnnotationsPanel,
  type CustomAnnotation,
} from '@/modules/mapkit-lab/components/AnnotationsPanel';
import { LANDMARKS } from '@/modules/mapkit-lab/landmarks';

function renderPanel(overrides: Partial<React.ComponentProps<typeof AnnotationsPanel>> = {}) {
  const props = {
    visibleAnnotationIds: new Set<string>(),
    customAnnotations: [] as ReadonlyArray<CustomAnnotation>,
    onToggleAnnotation: jest.fn(),
    onAddAtCenter: jest.fn(),
    ...overrides,
  };
  const utils = render(<AnnotationsPanel {...props} />);
  return { ...utils, props };
}

describe('AnnotationsPanel', () => {
  it('renders a row for each of the four landmarks with their names', () => {
    renderPanel();
    expect(LANDMARKS).toHaveLength(4);
    for (const landmark of LANDMARKS) {
      expect(screen.getByText(landmark.name)).toBeTruthy();
      expect(screen.getByTestId(`annotation-toggle-${landmark.id}`)).toBeTruthy();
    }
  });

  it('invokes onToggleAnnotation with the landmark id when each toggle is pressed', () => {
    const { props } = renderPanel();
    for (const landmark of LANDMARKS) {
      fireEvent.press(screen.getByTestId(`annotation-toggle-${landmark.id}`));
      expect(props.onToggleAnnotation).toHaveBeenLastCalledWith(landmark.id);
    }
    expect(props.onToggleAnnotation).toHaveBeenCalledTimes(LANDMARKS.length);
  });

  it('reflects checked state via accessibilityState when ids are in visibleAnnotationIds', () => {
    const visible = new Set([LANDMARKS[0].id, LANDMARKS[2].id]);
    renderPanel({ visibleAnnotationIds: visible });

    expect(
      screen.getByTestId(`annotation-toggle-${LANDMARKS[0].id}`).props.accessibilityState?.checked,
    ).toBe(true);
    expect(
      screen.getByTestId(`annotation-toggle-${LANDMARKS[1].id}`).props.accessibilityState?.checked,
    ).toBe(false);
    expect(
      screen.getByTestId(`annotation-toggle-${LANDMARKS[2].id}`).props.accessibilityState?.checked,
    ).toBe(true);
  });

  it('calls onAddAtCenter when the add button is pressed', () => {
    const { props } = renderPanel();
    fireEvent.press(screen.getByTestId('add-at-center-button'));
    expect(props.onAddAtCenter).toHaveBeenCalledTimes(1);
  });

  it('shows footer count reflecting customAnnotations.length', () => {
    const { rerender } = renderPanel({ customAnnotations: [] });
    expect(screen.getByTestId('custom-pin-count')).toHaveTextContent('Custom pins: 0');

    const customs: ReadonlyArray<CustomAnnotation> = [
      { kind: 'user-added', id: 'a', lat: 1, lng: 2 },
      { kind: 'user-added', id: 'b', lat: 3, lng: 4 },
      { kind: 'user-added', id: 'c', lat: 5, lng: 6 },
    ];
    rerender(
      <AnnotationsPanel
        visibleAnnotationIds={new Set()}
        customAnnotations={customs}
        onToggleAnnotation={jest.fn()}
        onAddAtCenter={jest.fn()}
      />,
    );
    expect(screen.getByTestId('custom-pin-count')).toHaveTextContent('Custom pins: 3');
  });
});
