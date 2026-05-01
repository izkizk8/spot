/**
 * @file SpiritLevel.test.tsx
 */
import React from 'react';
import { render } from '@testing-library/react-native';

import { SpiritLevel, __TEST_ONLY__ } from '@/modules/sensors-playground/components/SpiritLevel';

function flatten(style: unknown): Record<string, unknown> {
  if (!style) return {};
  if (Array.isArray(style)) return Object.assign({}, ...style.map(flatten));
  if (typeof style === 'object') return style as Record<string, unknown>;
  return {};
}

function translate(node: { props: { style: unknown } }): { tx: number; ty: number } {
  const s = flatten(node.props.style);
  const t = (s.transform as { translateX?: number; translateY?: number }[] | undefined) ?? [];
  const tx = t.find((x) => 'translateX' in x)?.translateX ?? 0;
  const ty = t.find((x) => 'translateY' in x)?.translateY ?? 0;
  return { tx, ty };
}

describe('SpiritLevel', () => {
  it('pitch=0, roll=0 → translate (0, 0)', () => {
    const { getByTestId } = render(<SpiritLevel pitch={0} roll={0} />);
    expect(translate(getByTestId('spirit-level-disc'))).toEqual({ tx: 0, ty: 0 });
  });

  it('pitch=π/2, roll=π/2 → translate clamped to MAX_OFFSET', () => {
    const { getByTestId } = render(<SpiritLevel pitch={Math.PI / 2} roll={Math.PI / 2} />);
    const { tx, ty } = translate(getByTestId('spirit-level-disc'));
    expect(tx).toBeCloseTo(__TEST_ONLY__.MAX_OFFSET, 3);
    expect(ty).toBeCloseTo(__TEST_ONLY__.MAX_OFFSET, 3);
  });

  it('negative pitch/roll clamps to -MAX_OFFSET', () => {
    const { getByTestId } = render(<SpiritLevel pitch={-Math.PI} roll={-Math.PI} />);
    const { tx, ty } = translate(getByTestId('spirit-level-disc'));
    expect(tx).toBeCloseTo(-__TEST_ONLY__.MAX_OFFSET, 3);
    expect(ty).toBeCloseTo(-__TEST_ONLY__.MAX_OFFSET, 3);
  });
});
