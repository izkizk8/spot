/**
 * T007: screen.test.tsx — iOS variant test (US1)
 *
 * Tests the main screen composition with ChartView mocked as a prop recorder.
 * Must FAIL before T010 implements screen.tsx.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// Mock ChartView as a prop recorder
const recordedChartViewProps: any[] = [];

jest.mock('@/modules/swift-charts-lab/components/ChartView', () => {
  const React = require('react');
  const recorder: any[] = [];
  // Export the recorder so tests can access it
  (global as any).__chartViewRecorder = recorder;
  return {
    ChartView: (props: any) => {
      recorder.push(props);
      return React.createElement('View', { testID: 'mocked-chart-view' });
    },
  };
});

// Import after mock
import SwiftChartsLabScreen from '@/modules/swift-charts-lab/screen';

// Helper to get recorded props
function getRecorded(): any[] {
  return (global as any).__chartViewRecorder || [];
}

describe('SwiftChartsLabScreen (iOS) — US1', () => {
  beforeEach(() => {
    // Clear recorded props before each test
    const recorded = getRecorded();
    recorded.length = 0;
  });

  it('does NOT render "iOS 16+ only" banner on iOS', () => {
    const { queryByText } = render(<SwiftChartsLabScreen />);
    expect(queryByText(/iOS 16/)).toBeNull();
  });

  it('renders ChartTypePicker with default "line" selected', () => {
    const { getByLabelText } = render(<SwiftChartsLabScreen />);

    const lineSegment = getByLabelText('Chart type: Line');
    expect(lineSegment.props.accessibilityState.selected).toBe(true);
  });

  it('ChartView initially receives type:line, data.length=12, tint.id=blue, gradientEnabled=false', () => {
    render(<SwiftChartsLabScreen />);

    const recorded = getRecorded();
    expect(recorded.length).toBeGreaterThan(0);
    const firstProps = recorded[0];
    expect(firstProps.type).toBe('line');
    expect(firstProps.data).toHaveLength(12);
    expect(firstProps.tint.id).toBe('blue');
    expect(firstProps.gradientEnabled).toBe(false);
  });

  it('pressing Bar segment updates ChartView with type:bar and same data reference', () => {
    const { getByLabelText } = render(<SwiftChartsLabScreen />);

    const recorded = getRecorded();
    const initialDataRef = recorded[recorded.length - 1].data;

    const barSegment = getByLabelText('Chart type: Bar');
    fireEvent.press(barSegment);

    const latestProps = recorded[recorded.length - 1];
    expect(latestProps.type).toBe('bar');
    expect(latestProps.data).toBe(initialDataRef); // Same reference - no mutation
  });

  it('pressing Area segment updates ChartView with type:area', () => {
    const { getByLabelText } = render(<SwiftChartsLabScreen />);

    const areaSegment = getByLabelText('Chart type: Area');
    fireEvent.press(areaSegment);

    const recorded = getRecorded();
    const latestProps = recorded[recorded.length - 1];
    expect(latestProps.type).toBe('area');
  });

  it('pressing Point segment updates ChartView with type:point', () => {
    const { getByLabelText } = render(<SwiftChartsLabScreen />);

    const pointSegment = getByLabelText('Chart type: Point');
    fireEvent.press(pointSegment);

    const recorded = getRecorded();
    const latestProps = recorded[recorded.length - 1];
    expect(latestProps.type).toBe('point');
  });
});
