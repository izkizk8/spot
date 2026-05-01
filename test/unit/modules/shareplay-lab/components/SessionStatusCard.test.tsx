/**
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import SessionStatusCard, {
  statusGlyph,
} from '@/modules/shareplay-lab/components/SessionStatusCard';

describe('SessionStatusCard', () => {
  it('renders the status pill with status text', () => {
    const { getByTestId } = render(
      <SessionStatusCard status='active' loading={false} onStart={() => {}} onEnd={() => {}} />,
    );
    const pill = getByTestId('shareplay-status-pill');
    const text = Array.isArray(pill.props.children)
      ? pill.props.children.join('')
      : String(pill.props.children);
    expect(text).toMatch(/active/);
  });

  it('disables the End button when status is none', () => {
    const { getByTestId } = render(
      <SessionStatusCard status='none' loading={false} onStart={() => {}} onEnd={() => {}} />,
    );
    expect(getByTestId('shareplay-end-button').props.accessibilityState.disabled).toBe(true);
  });

  it('enables the End button when active', () => {
    const { getByTestId } = render(
      <SessionStatusCard status='active' loading={false} onStart={() => {}} onEnd={() => {}} />,
    );
    expect(getByTestId('shareplay-end-button').props.accessibilityState.disabled).toBe(false);
  });

  it('invokes onStart and onEnd when their buttons fire', () => {
    const onStart = jest.fn();
    const onEnd = jest.fn();
    const { getByTestId } = render(
      <SessionStatusCard status='active' loading={false} onStart={onStart} onEnd={onEnd} />,
    );
    fireEvent.press(getByTestId('shareplay-start-button'));
    fireEvent.press(getByTestId('shareplay-end-button'));
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('shows the loading label on the start button', () => {
    const { getByTestId, getAllByText } = render(
      <SessionStatusCard status='preparing' loading={true} onStart={() => {}} onEnd={() => {}} />,
    );
    expect(getByTestId('shareplay-start-button').props.accessibilityState.disabled).toBe(true);
    expect(getAllByText(/Starting…/).length).toBeGreaterThan(0);
  });

  it('statusGlyph maps every status to a single glyph', () => {
    expect(statusGlyph('active')).toBe('🟢');
    expect(statusGlyph('preparing')).toBe('🟡');
    expect(statusGlyph('ended')).toBe('⚪');
    expect(statusGlyph('none')).toBe('⚫');
  });
});
