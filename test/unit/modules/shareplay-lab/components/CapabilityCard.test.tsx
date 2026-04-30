/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import CapabilityCard from '@/modules/shareplay-lab/components/CapabilityCard';

describe('CapabilityCard', () => {
  it('renders the available glyph when available is true', () => {
    const { getByTestId } = render(<CapabilityCard available={true} status="none" />);
    expect(getByTestId('shareplay-capability-card')).toBeTruthy();
    expect(getByTestId('shareplay-capability-available').props.children).toMatch(/✅/);
  });

  it('renders the unavailable glyph when available is false', () => {
    const { getByTestId } = render(<CapabilityCard available={false} status="none" />);
    expect(getByTestId('shareplay-capability-available').props.children).toMatch(/⛔/);
  });

  it('echoes the supplied session status', () => {
    const { getByTestId } = render(<CapabilityCard available={true} status="active" />);
    const node = getByTestId('shareplay-capability-status');
    const text = Array.isArray(node.props.children)
      ? node.props.children.join('')
      : String(node.props.children);
    expect(text).toMatch(/active/);
  });
});
