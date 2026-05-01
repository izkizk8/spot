/**
 * PhotoGrid Test
 * Feature: 057-photokit
 */

import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';

import PhotoGrid from '@/modules/photokit-lab/components/PhotoGrid';
import type { PhotoAsset } from '@/native/photokit.types';

const sampleAsset = (id: string, opts: Partial<PhotoAsset> = {}): PhotoAsset => ({
  id,
  uri: `file:///photos/${id}.jpg`,
  width: 1920,
  height: 1080,
  mediaType: 'image',
  filename: `${id}.jpg`,
  creationDate: 1_700_000_000_000,
  ...opts,
});

describe('PhotoGrid', () => {
  it('shows empty state when no assets', () => {
    render(<PhotoGrid assets={[]} />);
    expect(screen.getByText(/No photos selected yet/i)).toBeTruthy();
    expect(screen.getByText(/Selected Photos \(0\)/i)).toBeTruthy();
  });

  it('renders asset rows', () => {
    const assets = [sampleAsset('a'), sampleAsset('b', { mediaType: 'video', filename: 'b.mp4' })];
    render(<PhotoGrid assets={assets} />);
    expect(screen.getByText(/Selected Photos \(2\)/i)).toBeTruthy();
    expect(screen.getByText('a.jpg')).toBeTruthy();
    expect(screen.getByText('b.mp4')).toBeTruthy();
  });

  it('shows dimensions in metadata', () => {
    render(<PhotoGrid assets={[sampleAsset('c', { width: 800, height: 600 })]} />);
    expect(screen.getByText(/800×600/)).toBeTruthy();
  });

  it('shows dash for null creationDate', () => {
    render(<PhotoGrid assets={[sampleAsset('d', { creationDate: null })]} />);
    expect(screen.getByText(/—/)).toBeTruthy();
  });
});
