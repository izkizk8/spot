/**
 * Tests for ItemRow — feature 031 / T022.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import type { SearchableItem } from '@/native/spotlight.types';
import { DOMAIN_IDENTIFIER } from '@/native/spotlight.types';

import ItemRow from '@/modules/spotlight-lab/components/ItemRow';

function createItem(id: string, title: string, desc: string, keywords: string[]): SearchableItem {
  return {
    id: `${DOMAIN_IDENTIFIER}.${id}`,
    title,
    contentDescription: desc,
    keywords,
    domainIdentifier: DOMAIN_IDENTIFIER,
  };
}

describe('ItemRow', () => {
  it('renders title, contentDescription, and keyword chips', () => {
    const item = createItem('haptics', 'Haptics Playground', 'Explore haptic feedback', [
      'haptic',
      'vibration',
    ]);
    render(
      <ItemRow item={item} state="not-indexed" bulkPending={false} onToggle={() => undefined} />,
    );
    expect(screen.getByText('Haptics Playground')).toBeTruthy();
    expect(screen.getByText('Explore haptic feedback')).toBeTruthy();
    expect(screen.getByText('haptic')).toBeTruthy();
    expect(screen.getByText('vibration')).toBeTruthy();
  });

  it('renders IndexedState badge as "Indexed" when state is indexed', () => {
    const item = createItem('haptics', 'Haptics', 'Desc', []);
    render(<ItemRow item={item} state="indexed" bulkPending={false} onToggle={() => undefined} />);
    expect(screen.getByText(/indexed/i)).toBeTruthy();
  });

  it('renders IndexedState badge as "Not Indexed" when state is not-indexed', () => {
    const item = createItem('haptics', 'Haptics', 'Desc', []);
    render(
      <ItemRow item={item} state="not-indexed" bulkPending={false} onToggle={() => undefined} />,
    );
    expect(screen.getByText(/not.*indexed/i)).toBeTruthy();
  });

  it('tapping toggle CTA calls onToggle(id) exactly once (FR-031)', () => {
    const onToggle = jest.fn();
    const item = createItem('haptics', 'Haptics', 'Desc', []);
    render(<ItemRow item={item} state="not-indexed" bulkPending={false} onToggle={onToggle} />);
    // Find and press the toggle button
    const toggleButton = screen.getByRole('button');
    fireEvent.press(toggleButton);
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith(`${DOMAIN_IDENTIFIER}.haptics`);
  });

  it('toggle is disabled when bulkPending === true (FR-032)', () => {
    const onToggle = jest.fn();
    const item = createItem('haptics', 'Haptics', 'Desc', []);
    render(<ItemRow item={item} state="not-indexed" bulkPending={true} onToggle={onToggle} />);
    const toggleButton = screen.getByRole('button');
    // Pressable should have disabled state
    expect(toggleButton.props.accessibilityState?.disabled).toBe(true);
  });

  it('badge re-renders when state prop changes (FR-033)', () => {
    const item = createItem('haptics', 'Haptics', 'Desc', []);
    const { rerender } = render(
      <ItemRow item={item} state="indexed" bulkPending={false} onToggle={() => undefined} />,
    );
    expect(screen.getByText(/indexed/i)).toBeTruthy();
    expect(screen.queryByText(/not.*indexed/i)).toBeNull();

    // Simulate rejection revert: state changes back to not-indexed
    rerender(
      <ItemRow item={item} state="not-indexed" bulkPending={false} onToggle={() => undefined} />,
    );
    expect(screen.getByText(/not.*indexed/i)).toBeTruthy();
  });

  it('renders without crashing when keywords array is empty', () => {
    const item = createItem('haptics', 'Haptics', 'Desc', []);
    const { toJSON } = render(
      <ItemRow item={item} state="not-indexed" bulkPending={false} onToggle={() => undefined} />,
    );
    expect(toJSON()).toBeTruthy();
  });
});
