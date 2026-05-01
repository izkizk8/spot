/**
 * @file CompassNeedle.test.tsx
 */
import React from 'react';
import { render } from '@testing-library/react-native';

import { CompassNeedle } from '@/modules/sensors-playground/components/CompassNeedle';

function flatten(style: unknown): Record<string, unknown> {
  if (!style) return {};
  if (Array.isArray(style)) return Object.assign({}, ...style.map(flatten));
  if (typeof style === 'object') return style as Record<string, unknown>;
  return {};
}

function rotateDeg(node: { props: { style: unknown } }): number {
  const s = flatten(node.props.style);
  const t = (s.transform as { rotate?: string }[] | undefined) ?? [];
  const r = t.find((x) => x.rotate)?.rotate ?? '0deg';
  return parseFloat(r);
}

describe('CompassNeedle', () => {
  it('x=1, y=0 → 0deg', () => {
    const { getByTestId } = render(<CompassNeedle x={1} y={0} />);
    expect(rotateDeg(getByTestId('compass-needle-inner'))).toBeCloseTo(0, 3);
  });

  it('x=0, y=1 → 90deg', () => {
    const { getByTestId } = render(<CompassNeedle x={0} y={1} />);
    expect(rotateDeg(getByTestId('compass-needle-inner'))).toBeCloseTo(90, 3);
  });

  it('near-zero magnitude holds the previous angle (no NaN, no jitter to 0)', () => {
    const { getByTestId, rerender } = render(<CompassNeedle x={0} y={1} />);
    expect(rotateDeg(getByTestId('compass-needle-inner'))).toBeCloseTo(90, 3);
    rerender(<CompassNeedle x={0.0001} y={0.0001} />);
    const angle = rotateDeg(getByTestId('compass-needle-inner'));
    expect(angle).toBeCloseTo(90, 3);
    expect(Number.isNaN(angle)).toBe(false);
  });
});
