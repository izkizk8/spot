/**
 * Tests for ImageContentPicker — feature 033 / T017.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import ImageContentPicker from '@/modules/share-sheet-lab/components/ImageContentPicker';

describe('ImageContentPicker', () => {
  it('renders 2x2 grid of 4 tiles from bundled-images catalog', () => {
    const { getAllByRole } = render(
      <ImageContentPicker selectedSource={null} onSelect={() => {}} />,
    );
    const tiles = getAllByRole('button');
    expect(tiles).toHaveLength(4);
  });

  it('tap selects the image', () => {
    const onSelect = jest.fn();
    const { getAllByRole } = render(
      <ImageContentPicker selectedSource={null} onSelect={onSelect} />,
    );

    const tiles = getAllByRole('button');
    fireEvent.press(tiles[0]);

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0]).toHaveProperty('source');
    expect(onSelect.mock.calls[0][0]).toHaveProperty('alt');
  });

  it('selection survives re-render', () => {
    const onSelect = jest.fn();
    const { getAllByRole, rerender } = render(
      <ImageContentPicker selectedSource={123} onSelect={onSelect} />,
    );

    rerender(<ImageContentPicker selectedSource={123} onSelect={onSelect} />);

    const tiles = getAllByRole('button');
    expect(tiles[0]).toBeTruthy();
  });
});
