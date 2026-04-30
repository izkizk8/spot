/**
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import AlertsList, { severityGlyph } from '@/modules/weatherkit-lab/components/AlertsList';
import type { WeatherAlert } from '@/native/weatherkit.types';

const SAMPLE: readonly WeatherAlert[] = [
  {
    id: 'a1',
    title: 'High Wind Warning',
    summary: 'Winds gusting 60 mph through Tuesday morning.',
    severity: 'severe',
    source: 'NWS',
    issuedAt: '2026-05-09T09:00:00Z',
    expiresAt: '2026-05-10T09:00:00Z',
    detailsUrl: 'https://example.com/alerts/a1',
  },
  {
    id: 'a2',
    title: 'Heat Advisory',
    summary: 'Heat index 105°F.',
    severity: 'moderate',
    source: 'NWS',
    issuedAt: '2026-05-09T09:00:00Z',
    expiresAt: null,
    detailsUrl: null,
  },
];

describe('AlertsList', () => {
  it('renders the empty placeholder when alerts are empty', () => {
    const { getByTestId } = render(<AlertsList alerts={[]} />);
    expect(getByTestId('weatherkit-alerts-empty')).toBeTruthy();
  });

  it('renders one row per alert with the correct testID', () => {
    const { getByTestId } = render(<AlertsList alerts={SAMPLE} />);
    expect(getByTestId('weatherkit-alert-a1')).toBeTruthy();
    expect(getByTestId('weatherkit-alert-a2')).toBeTruthy();
  });

  it('toggles the expanded summary on press', () => {
    const { getByTestId, queryByTestId } = render(<AlertsList alerts={SAMPLE} />);
    expect(queryByTestId('weatherkit-alert-a1-summary')).toBeNull();
    fireEvent.press(getByTestId('weatherkit-alert-a1'));
    expect(getByTestId('weatherkit-alert-a1-summary')).toBeTruthy();
    fireEvent.press(getByTestId('weatherkit-alert-a1'));
    expect(queryByTestId('weatherkit-alert-a1-summary')).toBeNull();
  });

  it('severityGlyph picks distinct emojis per severity', () => {
    expect(severityGlyph('extreme')).toBe('🛑');
    expect(severityGlyph('severe')).toBe('⚠️');
    expect(severityGlyph('moderate')).toBe('⚠️');
    expect(severityGlyph('minor')).toBe('ℹ️');
    expect(severityGlyph('unknown')).toBe('ℹ️');
  });
});
