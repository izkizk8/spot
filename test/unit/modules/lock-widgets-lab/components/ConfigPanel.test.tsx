import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import ConfigPanel, {
  ConfigPanel as ConfigPanelNamed,
} from '@/modules/lock-widgets-lab/components/ConfigPanel';
import { ConfigPanel as ConfigPanel014 } from '@/modules/widgets-lab/components/ConfigPanel';
import { DEFAULT_LOCK_CONFIG, type LockConfig } from '@/modules/lock-widgets-lab/lock-config';

describe('ConfigPanel (lock-widgets-lab re-export)', () => {
  it('default export is identical to 014 ConfigPanel', () => {
    expect(ConfigPanel).toBe(ConfigPanel014);
    expect(ConfigPanelNamed).toBe(ConfigPanel014);
  });

  it('renders three controls: showcase, counter, tint', () => {
    const mockOnPush = jest.fn();
    const { getByLabelText, getAllByLabelText } = render(
      <ConfigPanel value={DEFAULT_LOCK_CONFIG} onPush={mockOnPush} pushEnabled={true} />,
    );

    expect(getByLabelText(/showcase/i)).toBeTruthy();
    expect(getByLabelText(/counter/i)).toBeTruthy();
    // Tint appears multiple times (picker + individual swatches)
    expect(getAllByLabelText(/tint/i).length).toBeGreaterThan(0);
  });

  it('calls onPush with validated config on tap', () => {
    const mockOnPush = jest.fn();
    const testConfig: LockConfig = {
      showcaseValue: 'Test Lock!',
      counter: 42,
      tint: 'green',
    };

    const { getByLabelText } = render(
      <ConfigPanel value={testConfig} onPush={mockOnPush} pushEnabled={true} />,
    );

    const pushButton = getByLabelText(/push.*widget/i);
    fireEvent.press(pushButton);

    expect(mockOnPush).toHaveBeenCalledWith(testConfig);
  });

  it('trims showcaseValue and disables Push button when empty', () => {
    const mockOnPush = jest.fn();
    const emptyConfig: LockConfig = {
      ...DEFAULT_LOCK_CONFIG,
      showcaseValue: '   ',
    };

    const { getByLabelText } = render(
      <ConfigPanel value={emptyConfig} onPush={mockOnPush} pushEnabled={true} />,
    );

    const pushButton = getByLabelText(/push.*widget/i);
    // Should be disabled because showcase value is empty after trimming
    expect(pushButton.props.accessibilityState.disabled).toBe(true);
  });

  it('accepts LockConfig type and renders without error', () => {
    const mockOnPush = jest.fn();
    const lockConfig: LockConfig = {
      showcaseValue: 'Hello, Lock!',
      counter: 99,
      tint: 'pink',
    };

    const { getByDisplayValue } = render(
      <ConfigPanel value={lockConfig} onPush={mockOnPush} pushEnabled={true} />,
    );

    // Check the inputs have the expected values
    expect(getByDisplayValue(/Hello, Lock!/i)).toBeTruthy();
    expect(getByDisplayValue(/99/)).toBeTruthy();
  });
});
