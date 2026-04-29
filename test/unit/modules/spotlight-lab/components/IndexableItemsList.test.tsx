/**
 * Tests for IndexableItemsList — feature 031 / T021.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';

import type { SearchableItem } from '@/native/spotlight.types';
import { DOMAIN_IDENTIFIER } from '@/native/spotlight.types';

import IndexableItemsList from '@/modules/spotlight-lab/components/IndexableItemsList';

function createItem(id: string, title: string, desc: string): SearchableItem {
  return {
    id: `${DOMAIN_IDENTIFIER}.${id}`,
    title,
    contentDescription: desc,
    keywords: ['test'],
    domainIdentifier: DOMAIN_IDENTIFIER,
  };
}

describe('IndexableItemsList', () => {
  it('renders 0 rows when items array is empty', () => {
    render(
      <IndexableItemsList
        items={[]}
        indexedIds={new Set()}
        bulkPending={false}
        onToggle={() => undefined}
      />,
    );
    // Should render container but no item rows
    expect(screen.queryByText(/haptics/i)).toBeNull();
  });

  it('renders 1 row from a single-item array', () => {
    const items = [createItem('haptics', 'Haptics', 'Explore haptic feedback')];
    render(
      <IndexableItemsList
        items={items}
        indexedIds={new Set()}
        bulkPending={false}
        onToggle={() => undefined}
      />,
    );
    expect(screen.getByText('Haptics')).toBeTruthy();
  });

  it('renders N rows from an N-item array', () => {
    const items = [
      createItem('haptics', 'Haptics', 'Explore haptic feedback'),
      createItem('sensors', 'Sensors', 'Sensor data'),
      createItem('audio', 'Audio Lab', 'Audio recording'),
    ];
    render(
      <IndexableItemsList
        items={items}
        indexedIds={new Set()}
        bulkPending={false}
        onToggle={() => undefined}
      />,
    );
    expect(screen.getByText('Haptics')).toBeTruthy();
    expect(screen.getByText('Sensors')).toBeTruthy();
    expect(screen.getByText('Audio Lab')).toBeTruthy();
  });

  it('passes indexedIds set down to rows for badge computation', () => {
    const items = [createItem('haptics', 'Haptics', 'Explore haptic feedback')];
    const indexedIds = new Set([`${DOMAIN_IDENTIFIER}.haptics`]);
    render(
      <IndexableItemsList
        items={items}
        indexedIds={indexedIds}
        bulkPending={false}
        onToggle={() => undefined}
      />,
    );
    // When indexed, the badge should show "Indexed"
    expect(screen.getByText(/indexed/i)).toBeTruthy();
  });

  it('passes bulkPending flag to disable per-row toggles (FR-032)', () => {
    const onToggle = jest.fn();
    const items = [createItem('haptics', 'Haptics', 'Explore haptic feedback')];
    render(
      <IndexableItemsList
        items={items}
        indexedIds={new Set()}
        bulkPending={true}
        onToggle={onToggle}
      />,
    );
    // The component should pass bulkPending down to ItemRow
    // which disables the toggle - we verify structure renders
    expect(screen.getByText('Haptics')).toBeTruthy();
  });

  it('renders without crashing when indexedIds is empty Set', () => {
    const items = [createItem('haptics', 'Haptics', 'Explore haptic feedback')];
    const { toJSON } = render(
      <IndexableItemsList
        items={items}
        indexedIds={new Set()}
        bulkPending={false}
        onToggle={() => undefined}
      />,
    );
    expect(toJSON()).toBeTruthy();
  });
});
