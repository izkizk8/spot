/**
 * DrawingCanvas Test
 * Feature: 082-pencilkit
 */

import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';

import DrawingCanvas from '@/modules/pencilkit-lab/components/DrawingCanvas';

describe('DrawingCanvas', () => {
  it('renders the canvas placeholder', () => {
    render(
      <DrawingCanvas
        stats={{ strokeCount: 0, dataLength: 0, boundingWidth: 0, boundingHeight: 0 }}
      />,
    );
    expect(screen.getByText(/Apple Pencil drawing canvas/i)).toBeTruthy();
  });

  it('mentions PKCanvasView in the hint', () => {
    render(
      <DrawingCanvas
        stats={{ strokeCount: 0, dataLength: 0, boundingWidth: 0, boundingHeight: 0 }}
      />,
    );
    expect(screen.getByText(/PKCanvasView/)).toBeTruthy();
  });

  it('shows the live stroke count', () => {
    render(
      <DrawingCanvas
        stats={{ strokeCount: 5, dataLength: 10, boundingWidth: 1, boundingHeight: 1 }}
      />,
    );
    expect(screen.getByText(/Strokes: 5/)).toBeTruthy();
  });
});
