/**
 * HeadingCard component (feature 025).
 *
 * Displays compass heading via CompassNeedle component,
 * shows calibration banner when needed, and error state.
 */
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { CompassNeedle } from '@/modules/sensors-playground/components/CompassNeedle';
import { useHeading } from '../hooks/useHeading';

export function HeadingCard(): React.JSX.Element {
  const { running, latest, error, isCalibrated, start, stop } = useHeading();

  // Auto-start heading subscription
  useEffect(() => {
    start();
    return () => {
      stop();
    };
  }, [start, stop]);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Heading</Text>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Heading not available</Text>
          <Text style={styles.errorDetail}>{error.message}</Text>
        </View>
      </View>
    );
  }

  const heading = latest?.magHeading ?? 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Heading</Text>

      {!isCalibrated && (
        <View style={styles.calibrationBanner}>
          <Text style={styles.calibrationText}>
            ⚠️ Compass needs calibration. Move device in a figure-8 pattern.
          </Text>
        </View>
      )}

      <View style={styles.compassContainer}>
        <CompassNeedle heading={heading} />
      </View>

      <View style={styles.readingContainer}>
        <Text style={styles.headingValue}>{Math.round(heading)}°</Text>
        <Text style={styles.headingLabel}>Magnetic North</Text>
      </View>

      {latest && (
        <View style={styles.detailsContainer}>
          <Text style={styles.detailText}>True Heading: {Math.round(latest.trueHeading)}°</Text>
          <Text style={styles.detailText}>
            Accuracy: {['Uncalibrated', 'Low', 'Medium', 'High'][latest.accuracy] ?? 'Unknown'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  calibrationBanner: {
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  calibrationText: {
    color: '#856404',
    fontSize: 14,
    textAlign: 'center',
  },
  compassContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  readingContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  headingValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#007AFF',
  },
  headingLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  detailsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginVertical: 2,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC3545',
  },
  errorDetail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});
