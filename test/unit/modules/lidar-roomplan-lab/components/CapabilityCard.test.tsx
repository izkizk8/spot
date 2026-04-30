/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import CapabilityCard from '@/modules/lidar-roomplan-lab/components/CapabilityCard';

describe('CapabilityCard', () => {
  it('renders the supported glyph when supported is true', () => {
    const { getByTestId } = render(<CapabilityCard supported={true} phase="idle" />);
    expect(getByTestId('roomplan-capability-card')).toBeTruthy();
    expect(getByTestId('roomplan-capability-supported').props.children).toMatch(/✅/);
  });

  it('renders the unsupported glyph when supported is false', () => {
    const { getByTestId } = render(<CapabilityCard supported={false} phase="idle" />);
    expect(getByTestId('roomplan-capability-supported').props.children).toMatch(/⛔/);
    expect(getByTestId('roomplan-capability-supported').props.children).toMatch(/LiDAR/);
  });

  it('echoes the supplied scan phase', () => {
    const { getByTestId } = render(<CapabilityCard supported={true} phase="scanning" />);
    const node = getByTestId('roomplan-capability-phase');
    const text = Array.isArray(node.props.children)
      ? node.props.children.join('')
      : String(node.props.children);
    expect(text).toMatch(/scanning/);
  });
});
