/**
 * T022: ChartView.web.test.tsx — Web fallback test
 *
 * Mirror of T021 - web variant behaves identically to android variant.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { initialDataset, TINTS } from '@/modules/swift-charts-lab/data';

// Explicit filename import per feature-006 pattern
const { ChartView } = require('@/modules/swift-charts-lab/components/ChartView.web');

describe('ChartView (Web fallback)', () => {
  it('renders 12 children for bar type with data.length=12', () => {
    const data = initialDataset();
    const { getAllByTestId } = render(
      <ChartView type="bar" data={data} tint={TINTS[0]} gradientEnabled={false} />,
    );

    const bars = getAllByTestId(/chart-bar-\d+/);
    expect(bars).toHaveLength(12);
  });

  it('applies tint backgroundColor to bars', () => {
    const data = initialDataset();
    const { getByTestId } = render(
      <ChartView type="bar" data={data} tint={TINTS[0]} gradientEnabled={false} />,
    );

    const bar0 = getByTestId('chart-bar-0');
    const styles = Array.isArray(bar0.props.style) ? bar0.props.style : [bar0.props.style];
    const hasBackgroundColor = styles.some((s: any) => s && s.backgroundColor === '#007AFF');
    expect(hasBackgroundColor).toBe(true);
  });

  it('renders with type=line (bars + top stripe)', () => {
    const data = initialDataset();
    const { getAllByTestId } = render(
      <ChartView type="line" data={data} tint={TINTS[0]} gradientEnabled={false} />,
    );

    const bars = getAllByTestId(/chart-bar-\d+/);
    expect(bars).toHaveLength(12);
  });

  it('renders with type=area', () => {
    const data = initialDataset();
    const { getAllByTestId } = render(
      <ChartView type="area" data={data} tint={TINTS[0]} gradientEnabled={false} />,
    );

    const bars = getAllByTestId(/chart-bar-\d+/);
    expect(bars).toHaveLength(12);
  });

  it('renders with type=point (dots)', () => {
    const data = initialDataset();
    const { getAllByTestId } = render(
      <ChartView type="point" data={data} tint={TINTS[0]} gradientEnabled={false} />,
    );

    const dots = getAllByTestId(/chart-dot-\d+/);
    expect(dots).toHaveLength(12);
  });

  it('gradientEnabled on bar type mounts overlay children', () => {
    const data = initialDataset();
    const { getAllByTestId } = render(
      <ChartView type="bar" data={data} tint={TINTS[0]} gradientEnabled={true} />,
    );

    const gradients = getAllByTestId(/chart-bar-\d+-gradient/);
    expect(gradients).toHaveLength(12);
  });

  it('gradientEnabled on line/area/point is a no-op', () => {
    const data = initialDataset();
    const { queryByTestId } = render(
      <ChartView type="line" data={data} tint={TINTS[0]} gradientEnabled={true} />,
    );

    expect(queryByTestId('chart-bar-0-gradient')).toBeNull();
  });

  it('root View has accessibilityLabel describing dataset', () => {
    const data = initialDataset();
    const { getByTestId } = render(
      <ChartView
        type="bar"
        data={data}
        tint={TINTS[0]}
        gradientEnabled={false}
        testID="chart-root"
      />,
    );

    const root = getByTestId('chart-root');
    expect(root.props.accessibilityLabel).toMatch(/Chart with 12 values.*Bar mode/i);
  });

  it('accepts selectedIndex and onSelect without crashing', () => {
    const data = initialDataset();
    const onSelect = jest.fn();

    expect(() => {
      render(
        <ChartView
          type="bar"
          data={data}
          tint={TINTS[0]}
          gradientEnabled={false}
          selectedIndex={3}
          onSelect={onSelect}
        />,
      );
    }).not.toThrow();
  });
});
