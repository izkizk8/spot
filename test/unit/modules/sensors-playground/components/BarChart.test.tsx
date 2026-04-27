/**
 * @file BarChart.test.tsx
 */
import React from 'react';
import { render } from '@testing-library/react-native';

import { BarChart, type XYZ } from '@/modules/sensors-playground/components/BarChart';

function flattenStyle(style: unknown): Record<string, unknown> {
  if (!style) return {};
  if (Array.isArray(style)) {
    return Object.assign({}, ...style.map(flattenStyle));
  }
  if (typeof style === 'object') return style as Record<string, unknown>;
  return {};
}

function widthOf(node: { props: { style: unknown } }): string {
  return flattenStyle(node.props.style).width as string;
}

describe('BarChart', () => {
  it('renders exactly 3 rows', () => {
    const { getAllByTestId } = render(<BarChart samples={[]} window={30} />);
    expect(getAllByTestId(/^bar-row-/)).toHaveLength(3);
  });

  it('with empty samples, all 3 fills have 0% width', () => {
    const { getByTestId } = render(<BarChart samples={[]} window={30} />);
    expect(widthOf(getByTestId('bar-fill-x'))).toBe('0%');
    expect(widthOf(getByTestId('bar-fill-y'))).toBe('0%');
    expect(widthOf(getByTestId('bar-fill-z'))).toBe('0%');
  });

  it('width is proportional to the max absolute value within the last `window` samples', () => {
    // 60-sample buffer; only the last 30 should affect the rendering.
    const samples: XYZ[] = [];
    for (let i = 0; i < 30; i++) samples.push({ x: 0, y: 0, z: 0 });
    for (let i = 0; i < 30; i++) samples.push({ x: 1, y: 0.5, z: 0.2 });
    const { getByTestId } = render(<BarChart samples={samples} window={30} scale={50} />);
    expect(widthOf(getByTestId('bar-fill-x'))).toBe('50%');
    expect(widthOf(getByTestId('bar-fill-y'))).toBe('25%');
    expect(widthOf(getByTestId('bar-fill-z'))).toBe('10%');
  });

  it('saturates at 100% rather than overflowing', () => {
    const samples: XYZ[] = [{ x: 100, y: 0, z: 0 }];
    const { getByTestId } = render(<BarChart samples={samples} window={30} scale={50} />);
    expect(widthOf(getByTestId('bar-fill-x'))).toBe('100%');
  });
});
