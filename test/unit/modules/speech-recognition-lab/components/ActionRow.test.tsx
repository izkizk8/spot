/**
 * T032: ActionRow component test (US1).
 *
 * Coverage:
 *   - Renders Clear + Copy buttons
 *   - Clear invokes onClear regardless of listening state
 *   - Copy disabled when canCopy=false
 *   - When enabled, Copy invokes onCopy once and shows "Copied" for ~2s
 *   - On rejection, shows "Copy failed" for ~2s without throwing
 *   - Both buttons expose accessibilityRole="button"
 */

import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import ActionRow from '@/modules/speech-recognition-lab/components/ActionRow';

function findButtonByLabel(root: any, regex: RegExp): any | null {
  const buttons = root.findAll((n: any) => n.props && n.props.accessibilityRole === 'button');
  for (const b of buttons) {
    const label = String(b.props.accessibilityLabel ?? '');
    if (regex.test(label)) return b;
  }
  // Fall back by visible text
  for (const b of buttons) {
    const json = JSON.stringify(b.props);
    if (regex.test(json)) return b;
  }
  return null;
}

describe('ActionRow', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders both Clear and Copy buttons', () => {
    render(<ActionRow canCopy={true} onClear={jest.fn()} onCopy={jest.fn()} />);
    expect(screen.queryByText(/clear/i)).toBeTruthy();
    expect(screen.queryByText(/copy/i)).toBeTruthy();
  });

  it('both buttons expose accessibilityRole="button"', () => {
    const { UNSAFE_root } = render(
      <ActionRow canCopy={true} onClear={jest.fn()} onCopy={jest.fn()} />,
    );
    const buttons = UNSAFE_root.findAll(
      (n: any) => n.props && n.props.accessibilityRole === 'button',
    );
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it('Clear invokes onClear when tapped', () => {
    const onClear = jest.fn();
    const { UNSAFE_root } = render(
      <ActionRow canCopy={false} onClear={onClear} onCopy={jest.fn()} />,
    );
    const clearBtn = findButtonByLabel(UNSAFE_root, /clear/i);
    expect(clearBtn).toBeTruthy();
    fireEvent.press(clearBtn!);
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('Clear invokes onClear even when canCopy=false', () => {
    const onClear = jest.fn();
    const { UNSAFE_root } = render(
      <ActionRow canCopy={false} onClear={onClear} onCopy={jest.fn()} />,
    );
    const clearBtn = findButtonByLabel(UNSAFE_root, /clear/i);
    fireEvent.press(clearBtn!);
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('Copy is disabled when canCopy=false (tap does not invoke onCopy)', () => {
    const onCopy = jest.fn();
    const { UNSAFE_root } = render(
      <ActionRow canCopy={false} onClear={jest.fn()} onCopy={onCopy} />,
    );
    const copyBtn = findButtonByLabel(UNSAFE_root, /copy/i);
    expect(copyBtn).toBeTruthy();
    expect(copyBtn!.props.accessibilityState?.disabled).toBe(true);
    fireEvent.press(copyBtn!);
    expect(onCopy).not.toHaveBeenCalled();
  });

  it('Copy invokes onCopy exactly once when enabled', async () => {
    const onCopy = jest.fn(() => Promise.resolve());
    const { UNSAFE_root } = render(
      <ActionRow canCopy={true} onClear={jest.fn()} onCopy={onCopy} />,
    );
    const copyBtn = findButtonByLabel(UNSAFE_root, /copy/i);
    await act(async () => {
      fireEvent.press(copyBtn!);
    });
    expect(onCopy).toHaveBeenCalledTimes(1);
  });

  it('shows "Copied" confirmation after successful onCopy and clears after ~2s', async () => {
    const onCopy = jest.fn(() => Promise.resolve());
    const { UNSAFE_root } = render(
      <ActionRow canCopy={true} onClear={jest.fn()} onCopy={onCopy} />,
    );
    const copyBtn = findButtonByLabel(UNSAFE_root, /copy/i);
    await act(async () => {
      fireEvent.press(copyBtn!);
    });
    expect(screen.queryByText(/copied/i)).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(2100);
    });
    expect(screen.queryByText(/^copied$/i)).toBeNull();
  });

  it('shows "Copy failed" when onCopy rejects, without throwing', async () => {
    const onCopy = jest.fn(() => Promise.reject(new Error('boom')));
    const { UNSAFE_root } = render(
      <ActionRow canCopy={true} onClear={jest.fn()} onCopy={onCopy} />,
    );
    const copyBtn = findButtonByLabel(UNSAFE_root, /copy/i);
    await act(async () => {
      fireEvent.press(copyBtn!);
    });
    expect(screen.queryByText(/copy failed/i)).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(2100);
    });
    expect(screen.queryByText(/copy failed/i)).toBeNull();
  });
});
