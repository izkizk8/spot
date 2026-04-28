/**
 * Tests for RegionMonitoringCard component (feature 025)
 */
import { fireEvent, render, screen } from '@testing-library/react-native';

import { RegionMonitoringCard } from '@/modules/core-location-lab/components/RegionMonitoringCard';
import type {
  MonitoredRegion,
  RegionEvent,
  RegionRadiusMeters,
} from '@/modules/core-location-lab/types';

// Mock the hook
const mockAddRegion = jest.fn();
const mockRemoveRegion = jest.fn();

jest.mock('@/modules/core-location-lab/hooks/useRegionMonitoring', () => ({
  useRegionMonitoring: () => ({
    regions: [] as MonitoredRegion[],
    events: [] as RegionEvent[],
    addRegion: mockAddRegion,
    removeRegion: mockRemoveRegion,
    error: null,
  }),
}));

describe('RegionMonitoringCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the title "Region Monitoring"', () => {
    render(<RegionMonitoringCard currentLocation={null} />);

    expect(screen.getByText('Region Monitoring')).toBeTruthy();
  });

  it('3-segment radius selector renders 50/100/500 options', () => {
    render(<RegionMonitoringCard currentLocation={null} />);

    expect(screen.getByText('50 m')).toBeTruthy();
    expect(screen.getByText('100 m')).toBeTruthy();
    expect(screen.getByText('500 m')).toBeTruthy();
  });

  it('Add button is disabled when no fix is provided', () => {
    render(<RegionMonitoringCard currentLocation={null} />);

    const addButton = screen.getByText('Add at current location');
    fireEvent.press(addButton);

    expect(mockAddRegion).not.toHaveBeenCalled();
  });

  it('Add button calls onAddRegion with selected radius when fix is available', () => {
    const currentLocation = { latitude: 37.78825, longitude: -122.4324 };
    render(<RegionMonitoringCard currentLocation={currentLocation} />);

    const addButton = screen.getByText('Add at current location');
    fireEvent.press(addButton);

    expect(mockAddRegion).toHaveBeenCalledWith(
      expect.objectContaining({
        latitude: 37.78825,
        longitude: -122.4324,
        radius: 100, // default radius
      }),
    );
  });

  it('tapping radius segment changes selected radius', () => {
    const currentLocation = { latitude: 37.78825, longitude: -122.4324 };
    render(<RegionMonitoringCard currentLocation={currentLocation} />);

    // Select 500m radius
    fireEvent.press(screen.getByText('500 m'));

    // Add a region
    fireEvent.press(screen.getByText('Add at current location'));

    expect(mockAddRegion).toHaveBeenCalledWith(
      expect.objectContaining({
        radius: 500,
      }),
    );
  });

  it('renders events log via EventLog', () => {
    render(<RegionMonitoringCard currentLocation={null} />);

    // EventLog should show empty state
    expect(screen.getByText(/No events yet/i)).toBeTruthy();
  });
});
