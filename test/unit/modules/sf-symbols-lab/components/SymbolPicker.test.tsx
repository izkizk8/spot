/**
 * @file SymbolPicker.test.tsx
 * @description Tests for SymbolPicker component (T006)
 * Per contracts/test-plan.md Story 1.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { SymbolPicker } from '@/modules/sf-symbols-lab/components/SymbolPicker';
import { SYMBOLS } from '@/modules/sf-symbols-lab/catalog';

// Mock AnimatedSymbol since SymbolPicker renders it for each cell
jest.mock(
  '@/modules/sf-symbols-lab/components/AnimatedSymbol',
  () => ({
    AnimatedSymbol: jest.fn(({ name }) => {
      const React = require('react');
      return React.createElement('View', {
        testID: `animated-symbol-${name}`,
      });
    }),
  }),
);

describe('SymbolPicker', () => {
  it('renders all 12 symbol cells', () => {
    const onSelect = jest.fn();
    render(
      <SymbolPicker
        symbols={SYMBOLS}
        selectedName={SYMBOLS[0].name}
        onSelect={onSelect}
        tintColor="#000"
      />,
    );

    // Each symbol should have a pressable button
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(12);
  });

  it('calls onSelect with the correct symbol when a cell is tapped', () => {
    const onSelect = jest.fn();
    render(
      <SymbolPicker
        symbols={SYMBOLS}
        selectedName={SYMBOLS[0].name}
        onSelect={onSelect}
        tintColor="#000"
      />,
    );

    const buttons = screen.getAllByRole('button');
    // Tap the 5th cell (index 4)
    fireEvent.press(buttons[4]);

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(SYMBOLS[4]);
  });

  it('highlights the selected cell with accessibilityState.selected', () => {
    const onSelect = jest.fn();
    const selectedName = SYMBOLS[2].name; // 'bolt.fill'

    render(
      <SymbolPicker
        symbols={SYMBOLS}
        selectedName={selectedName}
        onSelect={onSelect}
        tintColor="#000"
      />,
    );

    const buttons = screen.getAllByRole('button');
    // The 3rd button (index 2) should be selected
    expect(buttons[2].props.accessibilityState.selected).toBe(true);
    // Others should not
    expect(buttons[0].props.accessibilityState.selected).toBe(false);
    expect(buttons[1].props.accessibilityState.selected).toBe(false);
  });

  it('updates highlight when selectedName changes', () => {
    const onSelect = jest.fn();
    const { rerender } = render(
      <SymbolPicker
        symbols={SYMBOLS}
        selectedName={SYMBOLS[0].name}
        onSelect={onSelect}
        tintColor="#000"
      />,
    );

    let buttons = screen.getAllByRole('button');
    expect(buttons[0].props.accessibilityState.selected).toBe(true);

    // Change selection to index 5
    rerender(
      <SymbolPicker
        symbols={SYMBOLS}
        selectedName={SYMBOLS[5].name}
        onSelect={onSelect}
        tintColor="#000"
      />,
    );

    buttons = screen.getAllByRole('button');
    expect(buttons[0].props.accessibilityState.selected).toBe(false);
    expect(buttons[5].props.accessibilityState.selected).toBe(true);
  });
});
