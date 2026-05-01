/**
 * SubjectsList Test
 * Feature: 060-visual-look-up
 */

import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';

import SubjectsList from '@/modules/visual-look-up-lab/components/SubjectsList';
import type { Subject } from '@/native/visual-look-up.types';

const catSubject: Subject = {
  id: 's1',
  label: 'Cat',
  confidence: 0.92,
  boundingBox: { x: 0.1, y: 0.1, width: 0.5, height: 0.6 },
};

const dogSubject: Subject = {
  id: 's2',
  label: 'Dog',
  confidence: 0.75,
  boundingBox: { x: 0.2, y: 0.2, width: 0.4, height: 0.5 },
};

describe('SubjectsList', () => {
  it('shows the title', () => {
    render(<SubjectsList subjects={[]} loading={false} />);
    expect(screen.getByText(/Detected Subjects/i)).toBeTruthy();
  });

  it('shows placeholder when subjects is empty and not loading', () => {
    render(<SubjectsList subjects={[]} loading={false} />);
    expect(screen.getByText(/No subjects detected/i)).toBeTruthy();
  });

  it('shows loading text while analysing', () => {
    render(<SubjectsList subjects={[]} loading={true} />);
    expect(screen.getByText(/Analysi/i)).toBeTruthy();
  });

  it('renders subject label and confidence', () => {
    render(<SubjectsList subjects={[catSubject]} loading={false} />);
    expect(screen.getByText(/Cat/)).toBeTruthy();
    expect(screen.getByText(/92%/)).toBeTruthy();
  });

  it('renders multiple subjects', () => {
    render(<SubjectsList subjects={[catSubject, dogSubject]} loading={false} />);
    expect(screen.getByText(/Cat/)).toBeTruthy();
    expect(screen.getByText(/Dog/)).toBeTruthy();
    expect(screen.getByText(/75%/)).toBeTruthy();
  });
});
