/**
 * Tests for FileContentPicker.
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';

import FileContentPicker from '@/modules/share-sheet-lab/components/FileContentPicker';

describe('FileContentPicker', () => {
  it('renders the bundled fallback row', () => {
    render(<FileContentPicker selectedUri={null} onSelect={() => {}} />);
    expect(screen.getByText(/sample/i)).toBeTruthy();
  });
});
