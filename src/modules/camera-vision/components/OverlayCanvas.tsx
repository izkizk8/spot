/**
 * Overlay Canvas component for Camera Vision (feature 017).
 *
 * Renders bounding-box overlays for detected observations using
 * react-native-reanimated for smooth animations.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTheme } from '@/hooks/use-theme';
import type { Observation } from '../vision-types';
import { labelFor } from '../vision-types';

export interface OverlayCanvasProps {
  observations: Observation[];
  parentLayout: { width: number; height: number };
}

export function OverlayCanvas({ observations, parentLayout }: OverlayCanvasProps) {
  const reducedMotion = useReducedMotion();
  const theme = useTheme();

  return (
    <View style={styles.container} pointerEvents="none">
      {observations.map((observation, index) => (
        <OverlayRect
          key={index}
          index={index}
          observation={observation}
          parentLayout={parentLayout}
          reducedMotion={reducedMotion}
          borderColor={theme.tintA}
        />
      ))}
    </View>
  );
}

interface OverlayRectProps {
  index: number;
  observation: Observation;
  parentLayout: { width: number; height: number };
  reducedMotion: boolean;
  borderColor: string;
}

function OverlayRect({
  index,
  observation,
  parentLayout,
  reducedMotion,
  borderColor,
}: OverlayRectProps) {
  const { boundingBox } = observation;

  // Convert normalized [0, 1] to pixel coordinates
  const left = boundingBox.x * parentLayout.width;
  const top = boundingBox.y * parentLayout.height;
  const width = boundingBox.width * parentLayout.width;
  const height = boundingBox.height * parentLayout.height;

  const animatedLeft = useSharedValue(left);
  const animatedTop = useSharedValue(top);
  const animatedWidth = useSharedValue(width);
  const animatedHeight = useSharedValue(height);

  // Update animated values
  React.useEffect(() => {
    const duration = reducedMotion ? 0 : 150;
    animatedLeft.value = withTiming(left, { duration });
    animatedTop.value = withTiming(top, { duration });
    animatedWidth.value = withTiming(width, { duration });
    animatedHeight.value = withTiming(height, { duration });
  }, [
    left,
    top,
    width,
    height,
    reducedMotion,
    animatedLeft,
    animatedTop,
    animatedWidth,
    animatedHeight,
  ]);

  const animatedStyle = useAnimatedStyle(() => ({
    left: animatedLeft.value,
    top: animatedTop.value,
    width: animatedWidth.value,
    height: animatedHeight.value,
  }));

  // Use a stable index-based testID
  const testID = `overlay-${index}`;

  return (
    <Animated.View
      testID={testID}
      style={[styles.rect, animatedStyle, { borderColor }]}
      accessibilityLabel={labelFor(observation)}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  rect: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 4,
  },
});
