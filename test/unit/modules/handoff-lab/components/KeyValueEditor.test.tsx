/**
 * Unit tests: KeyValueEditor (T026 / US2).
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import KeyValueEditor, { type KeyValueRow } from '@/modules/handoff-lab/components/KeyValueEditor';

function setup(initial: KeyValueRow[] = []) {
  const onChange = jest.fn();
  const utils = render(<KeyValueEditor rows={initial} onChange={onChange} />);
  return { ...utils, onChange };
}

describe('KeyValueEditor', () => {
  it('renders existing rows', () => {
    const { getByDisplayValue } = setup([
      { key: 'a', value: '1' },
      { key: 'b', value: '2' },
    ]);
    expect(getByDisplayValue('a')).toBeTruthy();
    expect(getByDisplayValue('1')).toBeTruthy();
    expect(getByDisplayValue('b')).toBeTruthy();
  });

  it('add row appends an empty { key: "", value: "" }', () => {
    const { getByText, onChange } = setup([{ key: 'a', value: '1' }]);
    fireEvent.press(getByText(/Add row/i));
    expect(onChange).toHaveBeenCalledWith([
      { key: 'a', value: '1' },
      { key: '', value: '' },
    ]);
  });

  it('edit updates by index', () => {
    const { getByDisplayValue, onChange } = setup([{ key: 'a', value: '1' }]);
    fireEvent.changeText(getByDisplayValue('a'), 'aa');
    expect(onChange).toHaveBeenCalledWith([{ key: 'aa', value: '1' }]);
  });

  it('remove splices the row at index', () => {
    const { getAllByText, onChange } = setup([
      { key: 'a', value: '1' },
      { key: 'b', value: '2' },
    ]);
    const removeButtons = getAllByText(/Remove/i);
    fireEvent.press(removeButtons[0]);
    expect(onChange).toHaveBeenCalledWith([{ key: 'b', value: '2' }]);
  });

  it('surfaces a duplicate-key error string', () => {
    const { getByText } = setup([
      { key: 'a', value: '1' },
      { key: 'a', value: '2' },
    ]);
    expect(getByText(/duplicate/i)).toBeTruthy();
  });

  it('preserves row order in onChange payload', () => {
    const { getByText, onChange } = setup([
      { key: 'a', value: '1' },
      { key: 'b', value: '2' },
    ]);
    fireEvent.press(getByText(/Add row/i));
    expect(onChange.mock.calls[0][0]).toEqual([
      { key: 'a', value: '1' },
      { key: 'b', value: '2' },
      { key: '', value: '' },
    ]);
  });
});
