/**
 * Tests for LiveUpdatesCard component (feature 025)
 */
import { fireEvent, render, screen } from '@testing-library/react-native';

import { LiveUpdatesCard } from '@/modules/core-location-lab/components/LiveUpdatesCard';
import type { LocationSample } from '@/modules/core-location-lab/types';

// Mock the useLocationUpdates hook
const mockStart = jest.fn();
const mockStop = jest.fn();
const mockSetAccuracy = jest.fn();
const mockSetDistanceFilter = jest.fn();

jest.mock('@/modules/core-location-lab/hooks/useLocationUpdates', () => ({
  useLocationUpdates: () => ({
    isRunning: false,
    latest: null as LocationSample | null,
    samplesPerMinute: 0,
    start: mockStart,
    stop: mockStop,
    setAccuracy: mockSetAccuracy,
    setDistanceFilter: mockSetDistanceFilter,
    error: null,
    accuracy: { label: 'Best', value: 6 },
    distanceFilter: { label: '5 m', meters: 5 },
  }),
}));

describe('LiveUpdatesCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the title "Live Updates"', () => {
    render(<LiveUpdatesCard />);

    expect(screen.getByText('Live Updates')).toBeTruthy();
  });

  it('Start button calls hook start()', () => {
    render(<LiveUpdatesCard />);

    const startButton = screen.getByText('Start');
    fireEvent.press(startButton);

    expect(mockStart).toHaveBeenCalled();
  });

  it('accuracy selector renders 4 segments', () => {
    render(<LiveUpdatesCard />);

    // All 4 accuracy labels should be present
    expect(screen.getByText('Best')).toBeTruthy();
    expect(screen.getByText('Best for navigation')).toBeTruthy();
    expect(screen.getByText('Hundred meters')).toBeTruthy();
    expect(screen.getByText('Kilometer')).toBeTruthy();
  });

  it('tapping accuracy segment calls setAccuracy with matching preset', () => {
    render(<LiveUpdatesCard />);

    const bestForNavButton = screen.getByText('Best for navigation');
    fireEvent.press(bestForNavButton);

    expect(mockSetAccuracy).toHaveBeenCalledWith(
      expect.objectContaining({ label: 'Best for navigation' }),
    );
  });

  it('distance selector renders 3 segments', () => {
    render(<LiveUpdatesCard />);

    // All 3 distance labels should be present
    expect(screen.getByText('5 m')).toBeTruthy();
    expect(screen.getByText('50 m')).toBeTruthy();
    expect(screen.getByText('500 m')).toBeTruthy();
  });

  it('tapping distance segment calls setDistanceFilter', () => {
    render(<LiveUpdatesCard />);

    const distance500Button = screen.getByText('500 m');
    fireEvent.press(distance500Button);

    expect(mockSetDistanceFilter).toHaveBeenCalledWith(expect.objectContaining({ meters: 500 }));
  });

  it('renders LocationReadout component', () => {
    render(<LiveUpdatesCard />);

    // LocationReadout should show placeholder values when no sample
    expect(screen.getByText(/Latitude/i)).toBeTruthy();
    expect(screen.getByText(/Longitude/i)).toBeTruthy();
  });
});
