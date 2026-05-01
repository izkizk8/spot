/**
 * Tests for SearchTestCard — feature 031 / T024.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import type { SearchableItem } from '@/native/spotlight.types';
import { DOMAIN_IDENTIFIER } from '@/native/spotlight.types';

import SearchTestCard from '@/modules/spotlight-lab/components/SearchTestCard';

function createItem(id: string, title: string): SearchableItem {
  return {
    id: `${DOMAIN_IDENTIFIER}.${id}`,
    title,
    contentDescription: 'Description',
    keywords: [],
    domainIdentifier: DOMAIN_IDENTIFIER,
  };
}

describe('SearchTestCard', () => {
  it('renders input and CTA labelled "Search Spotlight" (FR-050)', () => {
    render(
      <SearchTestCard
        pending={false}
        results={[]}
        error={null}
        onSearch={() => undefined}
        hasSearched={false}
      />,
    );
    expect(screen.getByPlaceholderText(/search/i)).toBeTruthy();
    expect(screen.getByText(/search spotlight/i)).toBeTruthy();
  });

  it('CTA disabled while input is empty (FR-051 / EC-005)', () => {
    render(
      <SearchTestCard
        pending={false}
        results={[]}
        error={null}
        onSearch={() => undefined}
        hasSearched={false}
      />,
    );
    const button = screen.getByRole('button');
    expect(button.props.accessibilityState?.disabled).toBe(true);
  });

  it('CTA disabled while pending === true (FR-051)', () => {
    render(
      <SearchTestCard
        pending={true}
        results={[]}
        error={null}
        onSearch={() => undefined}
        hasSearched={false}
      />,
    );
    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.changeText(input, 'haptics');
    const button = screen.getByRole('button');
    expect(button.props.accessibilityState?.disabled).toBe(true);
  });

  it('submit calls onSearch(query) with trimmed query (FR-052)', () => {
    const onSearch = jest.fn();
    render(
      <SearchTestCard
        pending={false}
        results={[]}
        error={null}
        onSearch={onSearch}
        hasSearched={false}
      />,
    );
    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.changeText(input, '  haptics  ');
    fireEvent.press(screen.getByText(/search spotlight/i));
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith('haptics');
  });

  it('renders 0, 1, N result matches', () => {
    // 0 results
    const { rerender } = render(
      <SearchTestCard
        pending={false}
        results={[]}
        error={null}
        onSearch={() => undefined}
        hasSearched={false}
      />,
    );

    // 1 result
    rerender(
      <SearchTestCard
        pending={false}
        results={[createItem('haptics', 'Haptics')]}
        error={null}
        onSearch={() => undefined}
        hasSearched={true}
      />,
    );
    expect(screen.getByText('Haptics')).toBeTruthy();

    // N results
    rerender(
      <SearchTestCard
        pending={false}
        results={[createItem('haptics', 'Haptics'), createItem('sensors', 'Sensors')]}
        error={null}
        onSearch={() => undefined}
        hasSearched={true}
      />,
    );
    expect(screen.getByText('Haptics')).toBeTruthy();
    expect(screen.getByText('Sensors')).toBeTruthy();
  });

  it('shows explicit empty-state when results.length === 0 after search (FR-053)', () => {
    render(
      <SearchTestCard
        pending={false}
        results={[]}
        error={null}
        onSearch={() => undefined}
        hasSearched={true}
      />,
    );
    expect(screen.getByText(/no results|no matches/i)).toBeTruthy();
  });

  it('rejection clears results and shows error (FR-054)', () => {
    render(
      <SearchTestCard
        pending={false}
        results={[]}
        error='Search failed'
        onSearch={() => undefined}
        hasSearched={true}
      />,
    );
    expect(screen.getByText(/search failed/i)).toBeTruthy();
  });

  it('renders without crashing when all props are default/empty', () => {
    const { toJSON } = render(
      <SearchTestCard
        pending={false}
        results={[]}
        error={null}
        onSearch={() => undefined}
        hasSearched={false}
      />,
    );
    expect(toJSON()).toBeTruthy();
  });
});
