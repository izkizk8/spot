/**
 * SampleImageGrid component tests (feature 016).
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { SampleImageGrid } from '@/modules/coreml-lab/components/SampleImageGrid';

describe('SampleImageGrid', () => {
  it('renders four sample thumbnails', () => {
    const { getAllByTestId } = render(<SampleImageGrid selectedId={null} onSelect={jest.fn()} />);
    const thumbs = getAllByTestId(/^sample-/);
    expect(thumbs.length).toBe(4);
  });

  it('calls onSelect when a thumbnail is tapped', () => {
    const onSelect = jest.fn();
    const { getByTestId } = render(<SampleImageGrid selectedId={null} onSelect={onSelect} />);
    fireEvent.press(getByTestId('sample-red'));
    expect(onSelect).toHaveBeenCalledWith('red', expect.anything());
  });

  it('renders without throwing when an item is selected', () => {
    expect(() => render(<SampleImageGrid selectedId='red' onSelect={jest.fn()} />)).not.toThrow();
  });
});
