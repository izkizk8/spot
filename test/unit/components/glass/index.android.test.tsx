import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet, Text } from 'react-native';

// Import the Android variant explicitly by filename — Jest's iOS-default
// resolver would otherwise pick index.tsx.
import { Glass } from '@/components/glass/index.android';

function flattenStyle(style: unknown): Record<string, unknown> {
  if (Array.isArray(style)) {
    return style.reduce<Record<string, unknown>>((acc, s) => ({ ...acc, ...flattenStyle(s) }), {});
  }
  if (style && typeof style === 'object') return style as Record<string, unknown>;
  return {};
}

function rootStyle(tree: ReturnType<typeof render>): Record<string, unknown> {
  const json = tree.toJSON();
  if (json == null || Array.isArray(json) || typeof json === 'string') return {};
  return flattenStyle(json.props.style);
}

describe('<Glass> (Android fallback)', () => {
  it('renders a translucent rgba background derived from intensity', () => {
    const tree = render(
      <Glass intensity={0.6}>
        <Text>x</Text>
      </Glass>,
    );
    const style = rootStyle(tree);
    expect(typeof style.backgroundColor).toBe('string');
    expect(style.backgroundColor as string).toMatch(/^rgba\(255,255,255,0\.\d+\)$/);
  });

  it('uses the explicit tint when provided instead of the rgba fallback', () => {
    const tree = render(
      <Glass tint="rgba(80,210,150,0.32)">
        <Text>x</Text>
      </Glass>,
    );
    expect(rootStyle(tree).backgroundColor).toBe('rgba(80,210,150,0.32)');
  });

  it('applies elevation > 0 and a hairline border', () => {
    const tree = render(
      <Glass>
        <Text>x</Text>
      </Glass>,
    );
    const style = rootStyle(tree);
    expect(typeof style.elevation).toBe('number');
    expect(style.elevation as number).toBeGreaterThan(0);
    expect(style.borderWidth).toBe(StyleSheet.hairlineWidth);
    expect(typeof style.borderColor).toBe('string');
  });

  it('honors shape via borderRadius (pill -> 9999)', () => {
    const tree = render(
      <Glass shape="pill">
        <Text>x</Text>
      </Glass>,
    );
    expect(rootStyle(tree).borderRadius).toBe(9999);
  });

  it('passes children through', () => {
    const { getByText } = render(
      <Glass>
        <Text>android-child</Text>
      </Glass>,
    );
    expect(getByText('android-child')).toBeTruthy();
  });
});
