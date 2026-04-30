/**
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import SummaryItemsEditor from '@/modules/apple-pay-lab/components/SummaryItemsEditor';
import type { SummaryItem } from '@/native/applepay.types';

function setup(initial: readonly SummaryItem[] = [{ label: 'Coffee', amount: '4.50' }]) {
  const onChange = jest.fn();
  const utils = render(<SummaryItemsEditor items={initial} onChange={onChange} />);
  return { ...utils, onChange };
}

describe('SummaryItemsEditor', () => {
  it('renders the editor test id', () => {
    const { getByTestId } = setup();
    expect(getByTestId('apple-pay-summary-items-editor')).toBeTruthy();
  });

  it('renders one editable row per item', () => {
    const { getByTestId } = setup([
      { label: 'A', amount: '1.00' },
      { label: 'B', amount: '2.00' },
    ]);
    expect(getByTestId('apple-pay-summary-item-label-0').props.value).toBe('A');
    expect(getByTestId('apple-pay-summary-item-amount-1').props.value).toBe('2.00');
  });

  it('updates an item label', () => {
    const { getByTestId, onChange } = setup();
    fireEvent.changeText(getByTestId('apple-pay-summary-item-label-0'), 'Tea');
    expect(onChange).toHaveBeenCalledWith([{ label: 'Tea', amount: '4.50' }]);
  });

  it('removes an item', () => {
    const { getByTestId, onChange } = setup();
    fireEvent.press(getByTestId('apple-pay-summary-item-remove-0'));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('adds a new item from the draft inputs', () => {
    const { getByTestId, onChange } = setup();
    fireEvent.changeText(getByTestId('apple-pay-summary-item-draft-label'), 'Bagel');
    fireEvent.changeText(getByTestId('apple-pay-summary-item-draft-amount'), '2.75');
    fireEvent.press(getByTestId('apple-pay-summary-item-add'));
    expect(onChange).toHaveBeenCalledWith([
      { label: 'Coffee', amount: '4.50' },
      { label: 'Bagel', amount: '2.75' },
    ]);
  });

  it('does not add when the draft amount is invalid', () => {
    const { getByTestId, onChange } = setup();
    fireEvent.changeText(getByTestId('apple-pay-summary-item-draft-label'), 'X');
    fireEvent.changeText(getByTestId('apple-pay-summary-item-draft-amount'), 'oops');
    fireEvent.press(getByTestId('apple-pay-summary-item-add'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
