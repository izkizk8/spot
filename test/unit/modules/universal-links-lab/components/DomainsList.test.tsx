/**
 * Unit tests: DomainsList — Universal Links Lab.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import DomainsList, { parseDomain } from '@/modules/universal-links-lab/components/DomainsList';

describe('parseDomain', () => {
  it('classifies a real applinks: entry as configured', () => {
    expect(parseDomain('applinks:my.example.com')).toEqual({
      raw: 'applinks:my.example.com',
      host: 'my.example.com',
      status: 'configured',
    });
  });

  it('classifies the demo placeholder host as placeholder', () => {
    expect(parseDomain('applinks:spot.example.com').status).toBe('placeholder');
  });

  it('classifies entries missing the applinks: prefix as unknown', () => {
    expect(parseDomain('webcredentials:example.com').status).toBe('unknown');
  });

  it('classifies an empty applinks: entry as unknown', () => {
    expect(parseDomain('applinks:').status).toBe('unknown');
  });

  it('strips ?mode=… query suffix when extracting host', () => {
    expect(parseDomain('applinks:example.com?mode=developer').host).toBe('example.com');
  });
});

describe('DomainsList', () => {
  it('renders the empty state when no domains', () => {
    const { getByText } = render(<DomainsList domains={[]} />);
    expect(getByText(/No `applinks:` domains/)).toBeTruthy();
  });

  it('renders one row per domain with status pill', () => {
    const { getAllByTestId, getByTestId } = render(
      <DomainsList
        domains={['applinks:my.example.com', 'applinks:spot.example.com', 'webcreds:bad']}
      />,
    );
    expect(getAllByTestId(/domain-row-/).length).toBe(3);
    expect(getByTestId('domain-status-0')).toBeTruthy();
    expect(getByTestId('domain-status-1')).toBeTruthy();
    expect(getByTestId('domain-status-2')).toBeTruthy();
  });

  it('produces a non-empty snapshot', () => {
    const { toJSON } = render(<DomainsList domains={['applinks:x.example.com']} />);
    expect(toJSON()).toBeTruthy();
  });
});
