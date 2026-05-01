/**
 * SetupGuideCard — pass setup steps.
 * Feature: 036-passkit-wallet
 */

import React from 'react';
import { Linking, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

interface Step {
  title: string;
  description: string;
  link?: string;
}

const SETUP_STEPS: Step[] = [
  {
    title: '1. Register Pass Type ID',
    description:
      'Create a Pass Type ID in your Apple Developer account under Certificates, Identifiers & Profiles.',
    link: 'https://developer.apple.com/account/resources/identifiers/list/passTypeId',
  },
  {
    title: '2. Generate Pass Certificate',
    description: 'Create a Pass Type ID certificate and download it to sign your passes.',
    link: 'https://developer.apple.com/account/resources/certificates/list',
  },
  {
    title: '3. Create Pass Package',
    description: 'Build a .pass bundle with pass.json, manifest.json, signature, and assets.',
    link: 'https://developer.apple.com/documentation/walletpasses/building_a_pass',
  },
  {
    title: '4. Sign and Test',
    description:
      'Use signpass (or equivalent) to create a signed .pkpass file and test it in this app.',
    link: 'https://developer.apple.com/documentation/walletpasses',
  },
];

export function SetupGuideCard() {
  const handleLinkPress = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Setup Guide</ThemedText>
      <View>
        {SETUP_STEPS.map((step, index) => (
          <View key={index} style={styles.step} accessibilityRole='summary'>
            <ThemedText style={styles.stepTitle}>{step.title}</ThemedText>
            <ThemedText style={styles.stepDesc}>{step.description}</ThemedText>
            {step.link && (
              <TouchableOpacity
                onPress={() => handleLinkPress(step.link!)}
                accessibilityRole='link'
                style={styles.link}
              >
                <ThemedText style={styles.linkText}>Learn more →</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.three, borderRadius: Spacing.two },
  title: { fontSize: 16, fontWeight: '600', marginBottom: Spacing.two },
  step: { marginBottom: Spacing.three },
  stepTitle: { fontSize: 14, fontWeight: '600', marginBottom: Spacing.one },
  stepDesc: { fontSize: 12, opacity: 0.7, marginBottom: Spacing.one },
  link: { alignSelf: 'flex-start' },
  linkText: { fontSize: 12, color: '#007AFF', fontWeight: '600' },
});
