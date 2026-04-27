import { Platform, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeIn,
  useReducedMotion,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

const ENTER_DURATION = 480;

export default function HomeScreen() {
  const reducedMotion = useReducedMotion();

  const titleEnter = reducedMotion
    ? FadeIn.duration(0)
    : FadeInDown.duration(ENTER_DURATION).easing(Easing.out(Easing.cubic));
  const subtitleEnter = reducedMotion
    ? FadeIn.duration(0)
    : FadeInDown.duration(ENTER_DURATION).delay(120).easing(Easing.out(Easing.cubic));
  const cardEnter = reducedMotion
    ? FadeIn.duration(0)
    : FadeInDown.duration(ENTER_DURATION).delay(240).easing(Easing.out(Easing.cubic));

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.heroSection}>
          <Animated.View entering={titleEnter} style={styles.titleWrap}>
            <ThemedText type="title" style={styles.title}>
              Spot
            </ThemedText>
          </Animated.View>

          <Animated.View entering={subtitleEnter} style={styles.subtitleWrap}>
            <ThemedText type="subtitle" style={styles.subtitle} themeColor="textSecondary">
              An iOS feature showcase
            </ThemedText>
          </Animated.View>

          <Animated.View entering={cardEnter} style={styles.cardWrap}>
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="smallBold">Welcome</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Explore the Modules tab to try Liquid Glass and what comes next. Use Settings to
                pick System, Light, or Dark.
              </ThemedText>
            </ThemedView>
          </Animated.View>
        </ThemedView>

        {Platform.OS === 'web' && <WebBadge />}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
    alignSelf: 'stretch',
  },
  titleWrap: {
    alignSelf: 'stretch',
  },
  subtitleWrap: {
    alignSelf: 'stretch',
  },
  cardWrap: {
    alignSelf: 'stretch',
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  card: {
    gap: Spacing.two,
    padding: Spacing.four,
    borderRadius: Spacing.four,
  },
});
