/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import LiveStatusCard, {
  instructionFor,
  phaseGlyph,
} from '@/modules/lidar-roomplan-lab/components/LiveStatusCard';
import type { ScanPhase } from '@/native/roomplan.types';

describe('LiveStatusCard helpers', () => {
  it.each<ScanPhase>(['idle', 'scanning', 'processing', 'completed', 'error'])(
    'returns a non-empty instruction for %s',
    (phase) => {
      expect(instructionFor(phase).length).toBeGreaterThan(0);
    },
  );

  it('returns a unique glyph per phase', () => {
    const phases: ScanPhase[] = ['idle', 'scanning', 'processing', 'completed', 'error'];
    const glyphs = phases.map(phaseGlyph);
    const unique = new Set(glyphs);
    expect(unique.size).toBe(phases.length);
  });
});

describe('LiveStatusCard component', () => {
  it('renders the card and the supplied phase pill', () => {
    const { getByTestId } = render(<LiveStatusCard phase='scanning' />);
    expect(getByTestId('roomplan-live-status-card')).toBeTruthy();
    const pill = getByTestId('roomplan-phase-pill');
    const text = Array.isArray(pill.props.children)
      ? pill.props.children.join('')
      : String(pill.props.children);
    expect(text).toMatch(/scanning/);
  });

  it('renders the instruction for the given phase', () => {
    const { getByTestId } = render(<LiveStatusCard phase='completed' />);
    const inst = getByTestId('roomplan-instruction');
    const text = Array.isArray(inst.props.children)
      ? inst.props.children.join('')
      : String(inst.props.children);
    expect(text).toMatch(/Capture finished/);
  });

  it('renders the error message when provided', () => {
    const { getByTestId } = render(<LiveStatusCard phase='error' errorMessage='boom' />);
    expect(getByTestId('roomplan-error-message')).toBeTruthy();
  });

  it('omits the error message when null/undefined', () => {
    const { queryByTestId } = render(<LiveStatusCard phase='idle' />);
    expect(queryByTestId('roomplan-error-message')).toBeNull();
  });
});
