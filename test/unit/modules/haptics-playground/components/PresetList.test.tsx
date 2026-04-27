import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { PresetList } from '@/modules/haptics-playground/components/PresetList';
import type { Cell, Pattern, Preset } from '@/modules/haptics-playground/types';

const OFF: Cell = { kind: 'off' };
const pat = (i: number): Pattern =>
  [
    { kind: 'impact', intensity: i === 0 ? 'light' : 'heavy' },
    OFF,
    OFF,
    OFF,
    OFF,
    OFF,
    OFF,
    OFF,
  ] as unknown as Pattern;

const presets: Preset[] = [
  { id: 'a', name: 'Preset 1', pattern: pat(0), createdAt: '2024-01-01' },
  { id: 'b', name: 'Preset 2', pattern: pat(1), createdAt: '2024-01-02' },
];

describe('PresetList', () => {
  it('tapping a row fires onPlay with that preset', () => {
    const onPlay = jest.fn();
    const onDelete = jest.fn();
    const { getByText } = render(
      <PresetList presets={presets} onPlay={onPlay} onDelete={onDelete} />,
    );
    fireEvent.press(getByText('Preset 1'));
    expect(onPlay).toHaveBeenCalledTimes(1);
    expect(onPlay).toHaveBeenCalledWith(presets[0]);
  });

  it('tapping delete fires onDelete with that id', () => {
    const onPlay = jest.fn();
    const onDelete = jest.fn();
    const { getByTestId } = render(
      <PresetList presets={presets} onPlay={onPlay} onDelete={onDelete} />,
    );
    fireEvent.press(getByTestId('delete-b'));
    expect(onDelete).toHaveBeenCalledWith('b');
  });

  it('renders empty state when no presets', () => {
    const { getByText } = render(<PresetList presets={[]} onPlay={jest.fn()} onDelete={jest.fn()} />);
    expect(getByText(/no presets/i)).toBeTruthy();
  });
});
