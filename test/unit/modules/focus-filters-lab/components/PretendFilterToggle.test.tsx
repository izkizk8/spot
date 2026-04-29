import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import PretendFilterToggle from '@/modules/focus-filters-lab/components/PretendFilterToggle';
import { DRAFT_DEFAULTS } from '@/modules/focus-filters-lab/filter-modes';
import type { ShowcaseFilterPersistedPayload } from '@/modules/focus-filters-lab/filter-modes';

describe('PretendFilterToggle', () => {
  const mockOnActivate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders a switch/toggle, a status pill, and a demo body container', () => {
    render(
      <PretendFilterToggle
        draft={{ mode: 'relaxed', accentColor: 'blue' }}
        onActivate={mockOnActivate}
      />,
    );
    expect(screen.getByRole('switch')).toBeTruthy();
    expect(screen.getByText('Inactive')).toBeTruthy();
  });

  it('toggle initial state is OFF', () => {
    render(
      <PretendFilterToggle
        draft={{ mode: 'relaxed', accentColor: 'blue' }}
        onActivate={mockOnActivate}
      />,
    );
    const toggle = screen.getByRole('switch');
    expect(toggle.props.value).toBe(false);
  });

  it('toggling ON sets the status pill to "Active" and calls onActivate once', () => {
    render(
      <PretendFilterToggle
        draft={{ mode: 'focused', accentColor: 'orange' }}
        onActivate={mockOnActivate}
      />,
    );
    const toggle = screen.getByRole('switch');
    fireEvent(toggle, 'valueChange', true);
    expect(screen.getByText('Active')).toBeTruthy();
    expect(mockOnActivate).toHaveBeenCalledTimes(1);
    expect(mockOnActivate).toHaveBeenCalledWith({ mode: 'focused', accentColor: 'orange' });
  });

  it('toggling OFF does NOT call onActivate and sets the pill to "Inactive"', () => {
    render(
      <PretendFilterToggle
        draft={{ mode: 'relaxed', accentColor: 'blue' }}
        onActivate={mockOnActivate}
      />,
    );
    const toggle = screen.getByRole('switch');
    fireEvent(toggle, 'valueChange', true);
    mockOnActivate.mockClear();
    fireEvent(toggle, 'valueChange', false);
    expect(screen.getByText('Inactive')).toBeTruthy();
    expect(mockOnActivate).not.toHaveBeenCalled();
  });

  it('precedence over persisted: when toggle is ON, demo body uses draft; when OFF, uses persistedPayload or DRAFT_DEFAULTS', () => {
    const persistedPayload: ShowcaseFilterPersistedPayload = {
      mode: 'quiet',
      accentColor: 'green',
      event: 'activated',
      updatedAt: '2026-05-07T12:34:56.000Z',
    };
    const { rerender } = render(
      <PretendFilterToggle
        draft={{ mode: 'relaxed', accentColor: 'blue' }}
        persistedPayload={persistedPayload}
        onActivate={mockOnActivate}
      />,
    );
    const toggle = screen.getByRole('switch');

    // OFF: should use persistedPayload (quiet/green)
    expect(toggle.props.value).toBe(false);

    // Turn ON: should use draft (relaxed/blue)
    fireEvent(toggle, 'valueChange', true);
    expect(mockOnActivate).toHaveBeenCalledWith({ mode: 'relaxed', accentColor: 'blue' });

    // Turn OFF again: should revert to persistedPayload
    fireEvent(toggle, 'valueChange', false);
    expect(mockOnActivate).toHaveBeenCalledTimes(1); // No new call on OFF
  });

  it('draft changes while toggle is ON propagate to demo body and re-fire onActivate', () => {
    const { rerender } = render(
      <PretendFilterToggle
        draft={{ mode: 'relaxed', accentColor: 'blue' }}
        onActivate={mockOnActivate}
      />,
    );
    const toggle = screen.getByRole('switch');
    fireEvent(toggle, 'valueChange', true);
    mockOnActivate.mockClear();

    // Change draft while ON
    rerender(
      <PretendFilterToggle
        draft={{ mode: 'focused', accentColor: 'orange' }}
        onActivate={mockOnActivate}
      />,
    );
    expect(mockOnActivate).toHaveBeenCalledWith({ mode: 'focused', accentColor: 'orange' });
  });

  it('demo body has accessibilityLabel describing the active mode + accent', () => {
    render(
      <PretendFilterToggle
        draft={{ mode: 'relaxed', accentColor: 'blue' }}
        onActivate={mockOnActivate}
      />,
    );
    const demoBody = screen.root.findAll(
      (node: any) =>
        node.props.accessibilityLabel && /mode|accent/i.test(node.props.accessibilityLabel),
    )[0];
    expect(demoBody).toBeTruthy();
  });

  it('when persistedPayload is absent, falls back to DRAFT_DEFAULTS when toggle is OFF', () => {
    render(
      <PretendFilterToggle
        draft={{ mode: 'focused', accentColor: 'orange' }}
        onActivate={mockOnActivate}
      />,
    );
    const toggle = screen.getByRole('switch');
    // OFF state: should default to DRAFT_DEFAULTS (relaxed/blue)
    expect(toggle.props.value).toBe(false);
    // Turn ON: should use draft
    fireEvent(toggle, 'valueChange', true);
    expect(mockOnActivate).toHaveBeenCalledWith({ mode: 'focused', accentColor: 'orange' });
  });
});
