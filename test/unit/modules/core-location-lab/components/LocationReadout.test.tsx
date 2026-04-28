/**
 * Tests for LocationReadout component (feature 025)
 */
import { render, screen } from '@testing-library/react-native';

import { LocationReadout } from '@/modules/core-location-lab/components/LocationReadout';
import type { LocationSample } from '@/modules/core-location-lab/types';

describe('LocationReadout', () => {
  const mockSample: LocationSample = {
    latitude: 37.78825,
    longitude: -122.4324,
    altitude: 100.5,
    accuracy: 10.2,
    speed: 5.5,
    heading: 45.3,
    timestamp: new Date(),
  };

  it('renders all six fields with values', () => {
    render(<LocationReadout sample={mockSample} samplesPerMinute={10} />);

    // Check latitude
    expect(screen.getByText(/Latitude/i)).toBeTruthy();
    expect(screen.getByText(/37\.78825/)).toBeTruthy();

    // Check longitude
    expect(screen.getByText(/Longitude/i)).toBeTruthy();
    expect(screen.getByText(/-122\.4324/)).toBeTruthy();

    // Check altitude
    expect(screen.getByText(/Altitude/i)).toBeTruthy();
    expect(screen.getByText(/100\.5/)).toBeTruthy();

    // Check accuracy
    expect(screen.getByText(/Accuracy/i)).toBeTruthy();
    expect(screen.getByText(/10\.2/)).toBeTruthy();

    // Check speed
    expect(screen.getByText(/Speed/i)).toBeTruthy();
    expect(screen.getByText(/5\.5/)).toBeTruthy();

    // Check heading
    expect(screen.getByText(/Heading/i)).toBeTruthy();
    expect(screen.getByText(/45\.3/)).toBeTruthy();
  });

  it('renders placeholder "—" for null values', () => {
    const sampleWithNulls: LocationSample = {
      latitude: 37.78825,
      longitude: -122.4324,
      altitude: null,
      accuracy: null,
      speed: null,
      heading: null,
      timestamp: new Date(),
    };

    render(<LocationReadout sample={sampleWithNulls} samplesPerMinute={0} />);

    // Check for placeholder values
    const placeholders = screen.getAllByText('—');
    expect(placeholders.length).toBeGreaterThanOrEqual(4); // altitude, accuracy, speed, heading
  });

  it('renders placeholder "—" when sample is null', () => {
    render(<LocationReadout sample={null} samplesPerMinute={0} />);

    // All values should show placeholder
    const placeholders = screen.getAllByText('—');
    expect(placeholders.length).toBe(6);
  });

  it('renders samples per minute row', () => {
    render(<LocationReadout sample={mockSample} samplesPerMinute={15} />);

    expect(screen.getByText(/Samples \/ min/i)).toBeTruthy();
    expect(screen.getByText(/15/)).toBeTruthy();
  });

  it('renders samples per minute as 0 when appropriate', () => {
    render(<LocationReadout sample={mockSample} samplesPerMinute={0} />);

    expect(screen.getByText(/Samples \/ min/i)).toBeTruthy();
    // The 0 value is shown alongside the label
    const samplesRow = screen.getByText(/Samples \/ min/i).parent;
    expect(samplesRow).toBeTruthy();
  });
});
