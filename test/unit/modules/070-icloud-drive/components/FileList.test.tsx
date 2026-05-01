/**
 * FileList Test
 * Feature: 070-icloud-drive
 */

import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';

import FileList from '@/modules/icloud-drive-lab/components/FileList';
import type { ICloudFileItem } from '@/native/icloud-drive.types';

const sampleFile: ICloudFileItem = {
  name: 'demo.txt',
  url: 'icloud://containers/iCloud.com.example/demo.txt',
  size: 2048,
  modifiedAt: 1_700_000_000_000,
};

describe('FileList', () => {
  it('shows the title', () => {
    render(<FileList files={[]} loading={false} />);
    expect(screen.getByText(/iCloud Files/i)).toBeTruthy();
  });

  it('shows empty state when no files', () => {
    render(<FileList files={[]} loading={false} />);
    expect(screen.getByText(/No files/i)).toBeTruthy();
  });

  it('renders file names when files are present', () => {
    render(<FileList files={[sampleFile]} loading={false} />);
    expect(screen.getByText('demo.txt')).toBeTruthy();
  });

  it('shows loading indicator when loading', () => {
    render(<FileList files={[]} loading={true} />);
    expect(screen.getByLabelText(/Loading files/i)).toBeTruthy();
  });

  it('does not show empty state when loading', () => {
    render(<FileList files={[]} loading={true} />);
    expect(screen.queryByText(/No files/i)).toBeNull();
  });
});
