/**
 * @jest-environment jsdom
 *
 * Covers FR-017, US3-AS1, US5-AS2.
 */

import React from 'react';
import { Platform } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';

import AccessibilityPicker from '@/modules/keychain-lab/components/AccessibilityPicker';
import {
  ACCESSIBILITY_CLASSES,
  DEFAULT_ACCESSIBILITY_CLASS,
} from '@/modules/keychain-lab/accessibility-classes';

describe('AccessibilityPicker', () => {
  const originalOS = Platform.OS;
  beforeEach(() => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
  });
  afterAll(() => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOS });
  });

  it('renders all five accessibility classes with their descriptions', () => {
    const { getByText } = render(
      <AccessibilityPicker value={DEFAULT_ACCESSIBILITY_CLASS} onChange={jest.fn()} />,
    );

    expect(ACCESSIBILITY_CLASSES).toHaveLength(5);
    for (const descriptor of ACCESSIBILITY_CLASSES) {
      expect(getByText(descriptor.label)).toBeTruthy();
      expect(getByText(descriptor.description)).toBeTruthy();
    }
  });

  it('marks whenUnlockedThisDeviceOnly as the default selection', () => {
    const { getByTestId } = render(
      <AccessibilityPicker value={DEFAULT_ACCESSIBILITY_CLASS} onChange={jest.fn()} />,
    );

    const selected = getByTestId(`accessibility-option-${DEFAULT_ACCESSIBILITY_CLASS}`);
    expect(selected.props.accessibilityState?.selected).toBe(true);
  });

  it('invokes onChange when a different class is selected', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <AccessibilityPicker value={DEFAULT_ACCESSIBILITY_CLASS} onChange={onChange} />,
    );

    fireEvent.press(getByTestId('accessibility-option-afterFirstUnlock'));
    expect(onChange).toHaveBeenCalledWith('afterFirstUnlock');
  });
});

describe('AccessibilityPicker on Android', () => {
  const originalOS = Platform.OS;
  beforeAll(() => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
  });
  afterAll(() => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOS });
  });

  it('renders the picker disabled with the documented note on Android', () => {
    const onChange = jest.fn();
    const { getByText, getByTestId } = render(
      <AccessibilityPicker value={DEFAULT_ACCESSIBILITY_CLASS} onChange={onChange} />,
    );

    expect(getByText(/iOS/i)).toBeTruthy();

    const option = getByTestId(`accessibility-option-${DEFAULT_ACCESSIBILITY_CLASS}`);
    expect(option.props.accessibilityState?.disabled).toBe(true);

    fireEvent.press(getByTestId('accessibility-option-afterFirstUnlock'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
