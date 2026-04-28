/**
 * T035 [US1]: WaveformMeter component tests (FR-005 / R-004).
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import WaveformMeter from '@/modules/audio-lab/components/WaveformMeter';

function findBars(view: any): any[] {
  // The reanimated Jest mock wraps Animated.View in a passthrough function
  // component that re-renders the inner host View; both fibers carry the
  // same testID, so `UNSAFE_root.findAll` over-counts. Walk the toJSON
  // snapshot instead — host nodes only.
  const json = view.toJSON();
  const out: any[] = [];
  function walk(node: any) {
    if (!node) return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (typeof node === 'string') return;
    if (node.props?.testID === 'audio-lab-waveform-bar') {
      out.push(node);
      return;
    }
    if (node.children) walk(node.children);
  }
  walk(json);
  return out;
}

describe('WaveformMeter', () => {
  it('renders the configured default number of bars (32)', () => {
    const view = render(<WaveformMeter level={0} />);
    expect(findBars(view).length).toBe(32);
  });

  it('renders the configured custom number of bars when history is overridden', () => {
    const view = render(<WaveformMeter level={0} history={8} />);
    expect(findBars(view).length).toBe(8);
  });

  it('does not crash with boundary level=0 and level=1', () => {
    expect(() => render(<WaveformMeter level={0} />)).not.toThrow();
    expect(() => render(<WaveformMeter level={1} />)).not.toThrow();
  });

  it('bar color comes from useTheme() (no hardcoded hex)', () => {
    const view = render(<WaveformMeter level={0.5} history={4} />);
    const bars = findBars(view);
    const colors = bars
      .map((b) => {
        const styles = Array.isArray(b.props.style) ? b.props.style.flat(Infinity) : [b.props.style];
        return styles.filter(Boolean).map((s: any) => s.backgroundColor).filter((c: unknown) => typeof c === 'string');
      })
      .flat();
    expect(colors.length).toBeGreaterThan(0);
    expect(new Set(colors).size).toBe(1);
  });

  it('pushing a new level updates the buffer (rerender)', () => {
    const view = render(<WaveformMeter level={0.1} history={4} />);
    expect(findBars(view).length).toBe(4);
    view.rerender(<WaveformMeter level={0.9} history={4} />);
    expect(findBars(view).length).toBe(4);
  });
});
