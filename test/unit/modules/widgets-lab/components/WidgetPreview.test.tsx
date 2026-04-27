import React from 'react';
import { render } from '@testing-library/react-native';

import { WidgetPreview } from '@/modules/widgets-lab/components/WidgetPreview';
import { TINT_HEX } from '@/modules/widgets-lab/tints';
import type { WidgetConfig } from '@/modules/widgets-lab/widget-config';

const config: WidgetConfig = { showcaseValue: 'Hi widget', counter: 42, tint: 'green' };

describe('WidgetPreview', () => {
  it('renders three labelled cards (Small, Medium, Large)', () => {
    const { getByLabelText } = render(<WidgetPreview config={config} />);
    expect(getByLabelText('Preview Small')).toBeTruthy();
    expect(getByLabelText('Preview Medium')).toBeTruthy();
    expect(getByLabelText('Preview Large')).toBeTruthy();
  });

  it('shows showcaseValue and counter in each card', () => {
    const { getAllByText } = render(<WidgetPreview config={config} />);
    expect(getAllByText('Hi widget').length).toBeGreaterThanOrEqual(3);
    expect(getAllByText('42').length).toBeGreaterThanOrEqual(3);
  });

  it('uses the documented tint hex for the chosen tint', () => {
    const { toJSON } = render(<WidgetPreview config={config} />);
    const tree = JSON.stringify(toJSON());
    expect(tree).toContain(TINT_HEX.green);
  });

  it('re-renders when config prop changes', () => {
    const { getAllByText, rerender } = render(<WidgetPreview config={config} />);
    expect(getAllByText('Hi widget').length).toBeGreaterThanOrEqual(3);
    rerender(<WidgetPreview config={{ showcaseValue: 'New text', counter: 7, tint: 'pink' }} />);
    expect(getAllByText('New text').length).toBeGreaterThanOrEqual(3);
    expect(getAllByText('7').length).toBeGreaterThanOrEqual(3);
  });
});
