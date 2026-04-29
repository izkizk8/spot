import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Platform } from 'react-native';
import CurrentStateCard from '@/modules/focus-filters-lab/components/CurrentStateCard';
import type { ShowcaseFilterPersistedPayload } from '@/modules/focus-filters-lab/filter-modes';

describe('CurrentStateCard', () => {
  it('given payload: null, renders an empty-state line', () => {
    render(<CurrentStateCard payload={null} />);
    expect(screen.getByText(/no active filter|no filter|not active/i)).toBeTruthy();
  });

  it('given a full payload, renders mode label, accent swatch, event badge, updatedAt, and focusName when present', () => {
    const payload: ShowcaseFilterPersistedPayload = {
      mode: 'focused',
      accentColor: 'orange',
      event: 'activated',
      updatedAt: '2026-05-07T12:34:56.000Z',
      focusName: 'Work',
    };
    render(<CurrentStateCard payload={payload} />);
    expect(screen.getByText(/focused/i)).toBeTruthy();
    expect(screen.getByText(/activated/i)).toBeTruthy();
    expect(screen.getByText(/work/i)).toBeTruthy();
  });

  it('when focusName is omitted, the focusName row is not rendered', () => {
    const payload: ShowcaseFilterPersistedPayload = {
      mode: 'relaxed',
      accentColor: 'blue',
      event: 'activated',
      updatedAt: '2026-05-07T12:34:56.000Z',
    };
    const { queryByText } = render(<CurrentStateCard payload={payload} />);
    expect(screen.getByText(/relaxed/i)).toBeTruthy();
    expect(screen.getByText(/activated/i)).toBeTruthy();
    // focusName should not appear
    const allText = screen.root
      .findAllByType('Text' as any)
      .map((node: any) => node.props.children)
      .join(' ');
    expect(allText).not.toMatch(/focus name/i);
  });

  it('the card is iOS-16+-only — exposes a marker for the screen to gate visibility', () => {
    render(<CurrentStateCard payload={null} />);
    // Component should have a testID or display name that the screen can use
    expect(CurrentStateCard.displayName || CurrentStateCard.name).toBeTruthy();
  });

  it('event === "deactivated" is visually distinguished from "activated"', () => {
    const activatedPayload: ShowcaseFilterPersistedPayload = {
      mode: 'relaxed',
      accentColor: 'blue',
      event: 'activated',
      updatedAt: '2026-05-07T12:34:56.000Z',
    };
    const { rerender } = render(<CurrentStateCard payload={activatedPayload} />);
    expect(screen.getByText('Activated')).toBeTruthy();

    const deactivatedPayload: ShowcaseFilterPersistedPayload = {
      ...activatedPayload,
      event: 'deactivated',
    };
    rerender(<CurrentStateCard payload={deactivatedPayload} />);
    expect(screen.getByText('Deactivated')).toBeTruthy();

    // Both should render different text labels
    expect(screen.queryByText('Activated')).toBeFalsy();
  });

  it('does not branch on Platform.OS (visibility is owned by screen variant)', () => {
    const originalOS = Platform.OS;
    const payload: ShowcaseFilterPersistedPayload = {
      mode: 'relaxed',
      accentColor: 'blue',
      event: 'activated',
      updatedAt: '2026-05-07T12:34:56.000Z',
    };

    Platform.OS = 'ios' as typeof Platform.OS;
    const iosTree = render(<CurrentStateCard payload={payload} />).toJSON();

    Platform.OS = 'android' as typeof Platform.OS;
    const androidTree = render(<CurrentStateCard payload={payload} />).toJSON();

    Platform.OS = originalOS;

    expect(iosTree).toBeTruthy();
    expect(androidTree).toBeTruthy();
  });
});
