/**
 * T031: TranscriptView component test (US1).
 *
 * Coverage:
 *   - Renders finalized text (primary color) + partial appended (muted color)
 *   - Per-word opacity = clamp(0.4 + 0.6 * confidence, 0.4, 1)
 *   - Missing confidence defaults to opacity 1.0
 *   - Empty state renders "Tap the mic to start" placeholder
 *   - Uses ThemedText + Spacing
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';

import TranscriptView from '@/modules/speech-recognition-lab/components/TranscriptView';

function flattenStyle(style: unknown): Record<string, unknown> {
  if (!style) return {};
  if (Array.isArray(style)) {
    return style.reduce<Record<string, unknown>>(
      (acc, s) => Object.assign(acc, flattenStyle(s)),
      {},
    );
  }
  return style as Record<string, unknown>;
}

describe('TranscriptView', () => {
  it('renders empty placeholder "Tap the mic to start" when both layers empty', () => {
    render(<TranscriptView final="" partial="" />);
    expect(screen.queryByText(/tap the mic to start/i)).toBeTruthy();
  });

  it('does NOT render placeholder when final has content', () => {
    render(<TranscriptView final="Hello" partial="" />);
    expect(screen.queryByText(/tap the mic to start/i)).toBeNull();
  });

  it('does NOT render placeholder when partial has content', () => {
    render(<TranscriptView final="" partial="World" />);
    expect(screen.queryByText(/tap the mic to start/i)).toBeNull();
  });

  it('renders finalized text', () => {
    render(<TranscriptView final="Hello world" partial="" />);
    expect(screen.queryByText(/Hello world/i)).toBeTruthy();
  });

  it('renders partial text appended after final', () => {
    render(<TranscriptView final="Hello" partial="brave new world" />);
    expect(screen.queryByText(/brave new world/i)).toBeTruthy();
  });

  describe('Per-word opacity formula clamp(0.4 + 0.6 * confidence, 0.4, 1)', () => {
    it('opacity = 1.0 when confidence is undefined (default)', () => {
      const { UNSAFE_root } = render(
        <TranscriptView final="" partial="hello" words={[{ word: 'hello' }]} />,
      );
      const nodes = UNSAFE_root.findAll(
        (n: any) => n.props && n.props.children === 'hello' && n.props.style,
      );
      expect(nodes.length).toBeGreaterThan(0);
      const style = flattenStyle(nodes[0].props.style);
      expect(style.opacity).toBeCloseTo(1.0, 5);
    });

    it('opacity = 1.0 when confidence = 1.0', () => {
      const { UNSAFE_root } = render(
        <TranscriptView final="" partial="hi" words={[{ word: 'hi', confidence: 1.0 }]} />,
      );
      const nodes = UNSAFE_root.findAll(
        (n: any) => n.props && n.props.children === 'hi' && n.props.style,
      );
      const style = flattenStyle(nodes[0].props.style);
      expect(style.opacity).toBeCloseTo(1.0, 5);
    });

    it('opacity = 0.4 when confidence = 0', () => {
      const { UNSAFE_root } = render(
        <TranscriptView final="" partial="lo" words={[{ word: 'lo', confidence: 0 }]} />,
      );
      const nodes = UNSAFE_root.findAll(
        (n: any) => n.props && n.props.children === 'lo' && n.props.style,
      );
      const style = flattenStyle(nodes[0].props.style);
      expect(style.opacity).toBeCloseTo(0.4, 5);
    });

    it('opacity = 0.7 when confidence = 0.5', () => {
      const { UNSAFE_root } = render(
        <TranscriptView final="" partial="mid" words={[{ word: 'mid', confidence: 0.5 }]} />,
      );
      const nodes = UNSAFE_root.findAll(
        (n: any) => n.props && n.props.children === 'mid' && n.props.style,
      );
      const style = flattenStyle(nodes[0].props.style);
      expect(style.opacity).toBeCloseTo(0.7, 5);
    });
  });
});
