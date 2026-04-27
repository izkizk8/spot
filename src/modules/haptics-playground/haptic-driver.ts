import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

import type { HapticIntensity, ImpactIntensity, NotificationIntensity } from './types';

const cap = <T extends string>(s: T): Capitalize<T> =>
  (s.charAt(0).toUpperCase() + s.slice(1)) as Capitalize<T>;

export function play(kind: 'selection'): Promise<void>;
export function play(kind: 'impact', intensity: ImpactIntensity): Promise<void>;
export function play(kind: 'notification', intensity: NotificationIntensity): Promise<void>;
export async function play(
  kind: 'selection' | 'impact' | 'notification',
  intensity?: HapticIntensity,
): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }
  try {
    if (kind === 'selection') {
      await Haptics.selectionAsync();
      return;
    }
    if (kind === 'impact') {
      const key = cap(intensity as ImpactIntensity);
      const style = Haptics.ImpactFeedbackStyle[key];
      await Haptics.impactAsync(style);
      return;
    }
    if (kind === 'notification') {
      const key = cap(intensity as NotificationIntensity);
      const type = Haptics.NotificationFeedbackType[key];
      await Haptics.notificationAsync(type);
      return;
    }
  } catch {
    // Swallow — driver never throws (FR contract).
  }
}
