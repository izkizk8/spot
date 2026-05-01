import React from 'react';
import { StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';

import { StandByPreview } from '@/modules/standby-lab/components/StandByPreview';

describe('StandByPreview (standby-lab)', () => {
  it('renders both .systemMedium and .systemLarge stubs', () => {
    const { getByTestId } = render(
      <StandByPreview showcaseValue='X' counter={1} tint='blue' mode='fullColor' />,
    );
    expect(getByTestId('standby-preview-medium')).toBeTruthy();
    expect(getByTestId('standby-preview-large')).toBeTruthy();
  });

  it('renders the showcase value and counter', () => {
    const { getAllByText } = render(
      <StandByPreview showcaseValue='HelloX' counter={42} tint='blue' mode='fullColor' />,
    );
    expect(getAllByText('HelloX').length).toBe(2);
    expect(getAllByText('42').length).toBe(2);
  });

  it('mode=fullColor vs accented vs vibrant produce visually distinct cards', () => {
    const { getByTestId, rerender } = render(
      <StandByPreview showcaseValue='X' counter={1} tint='blue' mode='fullColor' />,
    );
    const flatten = (style: unknown) => StyleSheet.flatten(style as any) ?? {};
    const fullStyle = flatten(getByTestId('standby-preview-medium').props.style);

    rerender(<StandByPreview showcaseValue='X' counter={1} tint='blue' mode='accented' />);
    const accentedStyle = flatten(getByTestId('standby-preview-medium').props.style);

    rerender(<StandByPreview showcaseValue='X' counter={1} tint='blue' mode='vibrant' />);
    const vibrantStyle = flatten(getByTestId('standby-preview-medium').props.style);

    expect(JSON.stringify(fullStyle)).not.toEqual(JSON.stringify(accentedStyle));
    expect(JSON.stringify(accentedStyle)).not.toEqual(JSON.stringify(vibrantStyle));
    expect(JSON.stringify(fullStyle)).not.toEqual(JSON.stringify(vibrantStyle));
  });

  it('updating each prop triggers a re-render', () => {
    const { getByTestId, rerender, getAllByText } = render(
      <StandByPreview showcaseValue='A' counter={1} tint='blue' mode='fullColor' />,
    );
    expect(getAllByText('A').length).toBe(2);
    rerender(<StandByPreview showcaseValue='B' counter={2} tint='green' mode='accented' />);
    expect(getAllByText('B').length).toBe(2);
    expect(getAllByText('2').length).toBe(2);
    expect(getByTestId('standby-preview-large')).toBeTruthy();
  });

  it('a11y label of preview names rendering mode and tint', () => {
    const { getByLabelText } = render(
      <StandByPreview showcaseValue='X' counter={1} tint='orange' mode='vibrant' />,
    );
    expect(getByLabelText(/systemMedium.*vibrant.*orange/i)).toBeTruthy();
    expect(getByLabelText(/systemLarge.*vibrant.*orange/i)).toBeTruthy();
  });

  it('medium and large cards have non-zero dimensions per documented bounds', () => {
    const { getByTestId } = render(
      <StandByPreview showcaseValue='X' counter={1} tint='blue' mode='fullColor' />,
    );
    const flatten = (s: unknown) =>
      (StyleSheet.flatten(s as any) ?? {}) as { width?: number; height?: number };
    const medium = flatten(getByTestId('standby-preview-medium').props.style);
    const large = flatten(getByTestId('standby-preview-large').props.style);
    expect(medium.width).toBeGreaterThan(0);
    expect(medium.height).toBeGreaterThan(0);
    expect(large.width).toBeGreaterThan(0);
    expect(large.height).toBeGreaterThan(medium.height ?? 0);
  });
});
