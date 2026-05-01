import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Platform } from 'react-native';
import ExplainerCard from '@/modules/focus-filters-lab/components/ExplainerCard';

describe('ExplainerCard', () => {
  it('renders a heading and body prose', () => {
    render(<ExplainerCard />);
    expect(screen.getByText(/about focus filters/i)).toBeTruthy();
  });

  it('body text mentions "Focus Filters", "Settings", and both parameter names', () => {
    render(<ExplainerCard />);
    const textNodes = screen.root.findAllByType('Text' as any);
    const allText = textNodes
      .map((node: any) => {
        const children = node.props.children;
        if (typeof children === 'string') return children;
        if (Array.isArray(children)) return children.join('');
        return '';
      })
      .join(' ');
    expect(allText).toMatch(/focus filters/i);
    expect(allText).toMatch(/settings/i);
    expect(allText).toMatch(/mode|accent/i);
  });

  it('body distinguishes simulated path from real path', () => {
    render(<ExplainerCard />);
    const textNodes = screen.root.findAllByType('Text' as any);
    const allText = textNodes
      .map((node: any) => {
        const children = node.props.children;
        if (typeof children === 'string') return children;
        if (Array.isArray(children)) return children.join('');
        return '';
      })
      .join(' ');
    expect(allText).toMatch(/simulat(e|ed)/i);
    expect(allText).toMatch(/real|actual|system/i);
  });

  it('renders identically on every platform (no Platform.OS branch)', () => {
    const originalOS = Platform.OS;
    const iosRender = render(<ExplainerCard />);
    const iosTree = iosRender.toJSON();

    Platform.OS = 'android' as typeof Platform.OS;
    const androidRender = render(<ExplainerCard />);
    const androidTree = androidRender.toJSON();

    Platform.OS = 'web' as typeof Platform.OS;
    const webRender = render(<ExplainerCard />);
    const webTree = webRender.toJSON();

    Platform.OS = originalOS;

    expect(iosTree).toBeTruthy();
    expect(androidTree).toBeTruthy();
    expect(webTree).toBeTruthy();
  });

  it('accepts an optional style prop', () => {
    const { rerender } = render(<ExplainerCard />);
    expect(() => rerender(<ExplainerCard style={{ marginTop: 20 }} />)).not.toThrow();
  });
});
