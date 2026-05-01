/**
 * OCRResultCard Component Test
 * Feature: 080-live-text
 */

import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';

import OCRResultCard from '@/modules/live-text-lab/components/OCRResultCard';
import type { OCRResult } from '@/native/live-text.types';

const sampleResult: OCRResult = {
  blocks: [{ text: 'Hello World', confidence: 0.98, boundingBox: [0, 0, 0.5, 0.1] }],
  fullText: 'Hello World',
  recognisedAt: '2024-06-01T12:00:00Z',
};

describe('OCRResultCard', () => {
  it('renders placeholder when result is null', () => {
    render(<OCRResultCard result={null} />);
    expect(screen.getAllByText(/No result yet/i).length).toBeGreaterThan(0);
  });

  it('renders full text when result provided', () => {
    render(<OCRResultCard result={sampleResult} />);
    expect(screen.getAllByText(/Hello World/i).length).toBeGreaterThan(0);
  });

  it('renders confidence score', () => {
    render(<OCRResultCard result={sampleResult} />);
    expect(screen.getAllByText(/98\.0%/i).length).toBeGreaterThan(0);
  });

  it('renders OCR Result title', () => {
    render(<OCRResultCard result={null} />);
    expect(screen.getAllByText(/OCR Result/i).length).toBeGreaterThan(0);
  });
});
