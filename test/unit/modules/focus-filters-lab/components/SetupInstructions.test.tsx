import React from 'react';
import { render, screen } from '@testing-library/react-native';
import SetupInstructions from '@/modules/focus-filters-lab/components/SetupInstructions';

describe('SetupInstructions', () => {
  it('renders an ordered/numbered list with ≥7 steps', () => {
    render(<SetupInstructions />);
    const textNodes = screen.root.findAllByType('Text' as any);
    const allSteps = textNodes.filter((node: any) => {
      const children = node.props.children;
      if (typeof children === 'string') {
        return /^\d+\.\s/.test(children);
      }
      if (Array.isArray(children)) {
        // Check if first element is a number with dot
        const first = children[0];
        return typeof first === 'number' || (typeof first === 'string' && /^\d+\.\s/.test(first));
      }
      return false;
    });
    expect(allSteps.length).toBeGreaterThanOrEqual(7);
  });

  it('the steps mention Settings, Focus, Add Filter, spot, and Showcase Mode', () => {
    render(<SetupInstructions />);
    const textNodes = screen.root.findAllByType('Text' as any);
    const allText = textNodes
      .map((node: any) => {
        const children = node.props.children;
        if (typeof children === 'string') return children;
        if (Array.isArray(children)) return children.join('');
        return '';
      })
      .join(' ');
    expect(allText).toMatch(/settings/i);
    expect(allText).toMatch(/focus/i);
    expect(allText).toMatch(/add filter/i);
    expect(allText).toMatch(/spot/i);
    expect(allText).toMatch(/showcase\s*mode/i);
  });

  it('the card has a heading like "Set up the filter"', () => {
    render(<SetupInstructions />);
    expect(screen.getByText(/set up|setup|how to/i)).toBeTruthy();
  });

  it('accepts an optional style prop', () => {
    const { rerender } = render(<SetupInstructions />);
    expect(() => rerender(<SetupInstructions style={{ marginTop: 20 }} />)).not.toThrow();
  });
});
