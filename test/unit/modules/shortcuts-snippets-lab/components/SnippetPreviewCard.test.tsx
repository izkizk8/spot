/**
 * SnippetPreviewCard Tests — Feature 072
 */

import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import React from 'react';

import SnippetPreviewCard from '@/modules/shortcuts-snippets-lab/components/SnippetPreviewCard';

describe('SnippetPreviewCard', () => {
  it('shows empty state when snippet is null', () => {
    render(<SnippetPreviewCard snippet={null} />);
    expect(screen.getByText(/Snippet Preview/i)).toBeTruthy();
    expect(screen.getByText(/No snippet/i)).toBeTruthy();
  });

  it('shows confirmation snippet', () => {
    const snippet = {
      type: 'confirmation' as const,
      title: 'Confirm Order',
      detail: 'Order one coffee?',
      parameters: { item: 'Latte' },
    };
    render(<SnippetPreviewCard snippet={snippet} />);
    expect(screen.getAllByText(/Confirmation/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Confirm Order')).toBeTruthy();
  });

  it('shows result snippet', () => {
    const snippet = {
      type: 'result' as const,
      title: 'Order Placed',
      detail: 'Your order is on the way.',
      parameters: {},
    };
    render(<SnippetPreviewCard snippet={snippet} />);
    expect(screen.getAllByText(/Result/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Order Placed')).toBeTruthy();
  });
});
