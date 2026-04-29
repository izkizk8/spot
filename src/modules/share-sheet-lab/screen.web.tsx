/**
 * Share Sheet Lab Screen — Web variant.
 * feature 033 / T037.
 *
 * Same as Android. Must not import src/native/share-sheet.ts at evaluation time.
 */

import React, { useState } from 'react';
import { Button, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import { BUNDLED_IMAGES } from './bundled-images';
import ContentTypePicker from './components/ContentTypePicker';
import CustomActivityToggle from './components/CustomActivityToggle';
import ExcludedActivitiesPicker from './components/ExcludedActivitiesPicker';
import FileContentPicker from './components/FileContentPicker';
import ImageContentPicker from './components/ImageContentPicker';
import ResultLog from './components/ResultLog';
import TextContentInput from './components/TextContentInput';
import UrlContentInput from './components/UrlContentInput';
import { useShareSession } from './hooks/useShareSession';

export default function ShareSheetLabScreen() {
  const session = useShareSession();
  const [contentKind, setContentKind] = useState<'text' | 'url' | 'image' | 'file'>('text');

  const handleContentKindChange = (kind: 'text' | 'url' | 'image' | 'file') => {
    setContentKind(kind);
    
    switch (kind) {
      case 'text':
        session.setContent({ kind: 'text', text: 'Hello from spot showcase' });
        break;
      case 'url':
        session.setContent({ kind: 'url', url: 'https://expo.dev' });
        break;
      case 'image':
        session.setContent({
          kind: 'image',
          source: BUNDLED_IMAGES[0].source,
          alt: BUNDLED_IMAGES[0].alt,
        });
        break;
      case 'file':
        session.setContent({
          kind: 'file',
          uri: 'file://sample.txt',
          name: 'sample.txt',
          mimeType: 'text/plain',
          size: 27,
        });
        break;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ThemedView style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Content Type</ThemedText>
        <ContentTypePicker value={contentKind} onChange={handleContentKindChange} />
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Content</ThemedText>
        {contentKind === 'text' && (
          <TextContentInput
            value={session.content.kind === 'text' ? session.content.text : ''}
            onChange={(text) => session.setContent({ kind: 'text', text })}
          />
        )}
        {contentKind === 'url' && (
          <UrlContentInput
            value={session.content.kind === 'url' ? session.content.url : 'https://expo.dev'}
            onChange={(url) => session.setContent({ kind: 'url', url })}
          />
        )}
        {contentKind === 'image' && (
          <ImageContentPicker
            selectedSource={session.content.kind === 'image' ? session.content.source : null}
            onSelect={(img) => session.setContent({ kind: 'image', source: img.source, alt: img.alt })}
          />
        )}
        {contentKind === 'file' && (
          <FileContentPicker
            selectedUri={session.content.kind === 'file' ? session.content.uri : null}
            onSelect={(file) => session.setContent({ kind: 'file', ...file })}
          />
        )}
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Excluded Activities (iOS only)</ThemedText>
        <ExcludedActivitiesPicker
          selection={session.exclusions}
          onChange={session.setExclusions}
        />
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Custom Activity (iOS only)</ThemedText>
        <CustomActivityToggle
          value={session.includeCustomActivity}
          onValueChange={session.setIncludeCustomActivity}
        />
      </ThemedView>

      <ThemedView style={styles.section}>
        <Button title="Share" onPress={session.share} disabled={session.isSharing} />
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Result Log</ThemedText>
        <ResultLog entries={session.log} />
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
});
