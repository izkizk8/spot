/**
 * @file EffectPicker.test.tsx
 * @description Tests for EffectPicker component (T007)
 * Per contracts/test-plan.md Story 1.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { EffectPicker } from '@/modules/sf-symbols-lab/components/EffectPicker';
import { EFFECTS } from '@/modules/sf-symbols-lab/catalog';

describe('EffectPicker', () => {
  it('renders all 7 effect segments with their displayLabels', () => {
    const onSelect = jest.fn();
    render(<EffectPicker effects={EFFECTS} selectedId="bounce" onSelect={onSelect} />);

    // Check that all 7 effect labels are present
    expect(screen.getByText('Bounce')).toBeTruthy();
    expect(screen.getByText('Pulse')).toBeTruthy();
    expect(screen.getByText('Scale')).toBeTruthy();
    expect(screen.getByText('Variable Color')).toBeTruthy();
    expect(screen.getByText('Replace')).toBeTruthy();
    expect(screen.getByText('Appear')).toBeTruthy();
    expect(screen.getByText('Disappear')).toBeTruthy();
  });

  it('highlights Bounce segment when selectedId is "bounce"', () => {
    const onSelect = jest.fn();
    render(<EffectPicker effects={EFFECTS} selectedId="bounce" onSelect={onSelect} />);

    // Find all buttons (segments)
    const buttons = screen.getAllByRole('button');
    expect(buttons[0].props.accessibilityState.selected).toBe(true);
  });

  it('calls onSelect with the effect when a segment is tapped', () => {
    const onSelect = jest.fn();
    render(<EffectPicker effects={EFFECTS} selectedId="bounce" onSelect={onSelect} />);

    // Tap the Pulse segment (index 1)
    const buttons = screen.getAllByRole('button');
    fireEvent.press(buttons[1]);

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(EFFECTS[1]); // Pulse
  });

  it('calls onSelect when Replace is tapped', () => {
    const onSelect = jest.fn();
    render(<EffectPicker effects={EFFECTS} selectedId="bounce" onSelect={onSelect} />);

    // Find and tap Replace segment (index 4)
    const buttons = screen.getAllByRole('button');
    fireEvent.press(buttons[4]);

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(EFFECTS[4]); // Replace
    expect(EFFECTS[4].id).toBe('replace');
    expect(EFFECTS[4].requiresSecondarySymbol).toBe(true);
  });

  it('applies selected state to the active segment', () => {
    const onSelect = jest.fn();
    render(<EffectPicker effects={EFFECTS} selectedId="scale" onSelect={onSelect} />);

    const buttons = screen.getAllByRole('button');
    // Scale is at index 2
    expect(buttons[2].props.accessibilityState.selected).toBe(true);
    expect(buttons[0].props.accessibilityState.selected).toBe(false);
    expect(buttons[1].props.accessibilityState.selected).toBe(false);
  });
});
