import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import { Glass } from '@/components/glass/index.web';

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

describe('<Glass> (web fallback)', () => {
  it('inlines a backdropFilter blur(<n>px) reflecting the intensity', () => {
    const tree = render(
      <Glass intensity={0.5}>
        <Text>x</Text>
      </Glass>,
    );
    const style = rootStyle(tree);
    // 0.5 -> round(4 + 0.5*24) = 16
    expect(style.backdropFilter).toBe('blur(16px) saturate(180%)');
    expect(style.WebkitBackdropFilter).toBe('blur(16px) saturate(180%)');
  });

  it('blur radius scales with intensity', () => {
    const treeMin = render(
      <Glass intensity={0}>
        <Text>x</Text>
      </Glass>,
    );
    expect(rootStyle(treeMin).backdropFilter).toBe('blur(4px) saturate(180%)');

    const treeMax = render(
      <Glass intensity={1}>
        <Text>x</Text>
      </Glass>,
    );
    expect(rootStyle(treeMax).backdropFilter).toBe('blur(28px) saturate(180%)');
  });

  it('uses the tint as the background color when provided', () => {
    const tree = render(
      <Glass tint="rgba(255,99,132,0.32)">
        <Text>x</Text>
      </Glass>,
    );
    expect(rootStyle(tree).backgroundColor).toBe('rgba(255,99,132,0.32)');
  });

  it('falls back to a translucent white background when no tint is provided', () => {
    const tree = render(
      <Glass>
        <Text>x</Text>
      </Glass>,
    );
    expect(rootStyle(tree).backgroundColor).toBe('rgba(255,255,255,0.16)');
  });

  it('passes children through', () => {
    const { getByText } = render(
      <Glass>
        <Text>web-child</Text>
      </Glass>,
    );
    expect(getByText('web-child')).toBeTruthy();
  });
});
