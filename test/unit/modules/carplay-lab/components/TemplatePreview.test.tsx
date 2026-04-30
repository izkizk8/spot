/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import TemplatePreview from '@/modules/carplay-lab/components/TemplatePreview';

describe('TemplatePreview (carplay)', () => {
  it('renders the canvas for the picked kind', () => {
    const { getByTestId } = render(<TemplatePreview kind="list" />);
    expect(getByTestId('carplay-preview-canvas-list')).toBeTruthy();
  });

  it('renders the four List preview lines', () => {
    const { getByTestId } = render(<TemplatePreview kind="list" />);
    // CPListTemplate previewLines: 4 entries
    expect(getByTestId('carplay-preview-line-0')).toBeTruthy();
    expect(getByTestId('carplay-preview-line-3')).toBeTruthy();
  });

  it('updates the canvas when the kind prop changes', () => {
    const { rerender, getByTestId, queryByTestId } = render(<TemplatePreview kind="list" />);
    expect(getByTestId('carplay-preview-canvas-list')).toBeTruthy();
    rerender(<TemplatePreview kind="map" />);
    expect(getByTestId('carplay-preview-canvas-map')).toBeTruthy();
    expect(queryByTestId('carplay-preview-canvas-list')).toBeNull();
  });

  it('renders the now-playing className label', () => {
    const { getByText } = render(<TemplatePreview kind="now-playing" />);
    expect(getByText('CPNowPlayingTemplate')).toBeTruthy();
  });
});
