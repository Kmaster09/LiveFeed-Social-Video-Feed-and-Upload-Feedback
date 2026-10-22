
import React, { useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import { colors } from '../styles/theme';

export default function CreateVideoScreen() {
  const [selectedUri, setSelectedUri] = useState(null);
  const [caption, setCaption] = useState('');
  const [uploadState, setUploadState] = useState('idle');
  const [message, setMessage] = useState('');

  const successOpacity = useRef(new Animated.Value(0)).current;
  const errorOpacity = useRef(new Animated.Value(0)).current;
  const pickScale = useRef(new Animated.Value(1)).current;

  const player = useVideoPlayer(
    selectedUri ? { uri: selectedUri } : null,
    (instance) => {
      instance.loop = true;
    }
  );

  async function chooseVideo() {
    if (uploadState === 'uploading') return;

    setMessage('');
    setUploadState('idle');
    errorOpacity.setValue(0);

    try {
      if (Platform.OS !== 'web') {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          setUploadState('error');
          setMessage(
            'Media library permission was denied. Allow access in your device settings to choose a video.'
          );

          Animated.timing(errorOpacity, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }).start();

          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const video = result.assets[0];

      if (video.type && video.type !== 'video') {
        setUploadState('error');
        setMessage('Please select a video file, not an image.');

        Animated.timing(errorOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }).start();

        return;
      }

      setSelectedUri(video.uri);
      setUploadState('idle');
      setMessage('');
      successOpacity.setValue(0);
      errorOpacity.setValue(0);
    } catch (error) {
      setUploadState('error');
      setMessage('Could not open the video picker. Please try again.');

      Animated.timing(errorOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }

  async function postVideo() {
    if (uploadState === 'uploading') return;

    if (!selectedUri) {
      setUploadState('error');
      setMessage('Choose a short video before posting.');
      errorOpacity.setValue(0);

      Animated.timing(errorOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();

      return;
    }

    setUploadState('uploading');
    setMessage('Uploading your video...');
    successOpacity.setValue(0);
    errorOpacity.setValue(0);

    try {
      // Simulated upload for the assignment.
      await new Promise((resolve) => setTimeout(resolve, 1600));

      setUploadState('success');
      setMessage('Video posted successfully!');

      Animated.spring(successOpacity, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      setUploadState('error');
      setMessage('Something went wrong while posting. Please try again.');

      Animated.timing(errorOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }

  function pressPickIn() {
    Animated.spring(pickScale, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  }

  function pressPickOut() {
    Animated.spring(pickScale, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  }

  const isUploading = uploadState === 'uploading';

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Close create video screen"
        >
          <Ionicons name="close" size={29} color={colors.text} />
        </Pressable>

        <Text style={styles.title}>Create video post</Text>

        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Animated.View style={{ transform: [{ scale: pickScale }] }}>
          <Pressable
            onPress={chooseVideo}
            onPressIn={pressPickIn}
            onPressOut={pressPickOut}
            disabled={isUploading}
            style={styles.pickButton}
          >
            <Ionicons
              name="videocam"
              size={24}
              color={colors.blue}
            />

            <Text style={styles.pickText}>
              {selectedUri
                ? 'Choose a different video'
                : 'Choose short video'}
            </Text>
          </Pressable>
        </Animated.View>

        {selectedUri ? (
          <View style={styles.previewCard}>
            <View style={styles.previewHeading}>
              <Text style={styles.sectionLabel}>VIDEO PREVIEW</Text>

              <Ionicons
                name="checkmark-circle"
                size={20}
                color={colors.success}
              />
            </View>

            <VideoView
              player={player}
              style={styles.preview}
              contentFit="contain"
              nativeControls
            />

            <Text style={styles.previewHint}>
              Check your video before posting.
            </Text>
          </View>
        ) : (
          <View style={styles.emptyPreview}>
            <Ionicons
              name="film-outline"
              size={46}
              color={colors.muted}
            />

            <Text style={styles.emptyTitle}>No video selected</Text>

            <Text style={styles.emptyText}>
              Choose a short video from your device to preview it before
              posting.
            </Text>
          </View>
        )}

        <TextInput
          value={caption}
          onChangeText={setCaption}
          placeholder="Say something about this video..."
          placeholderTextColor={colors.muted}
          style={styles.input}
          multiline
          editable={!isUploading}
          accessibilityLabel="Video caption"
        />

        <Pressable
          onPress={postVideo}
          disabled={isUploading}
          style={[
            styles.postButton,
            isUploading && styles.postButtonDisabled,
          ]}
        >
          {isUploading ? (
            <View style={styles.uploadingContent}>
              <Ionicons
                name="cloud-upload-outline"
                size={21}
                color="#FFFFFF"
              />

              <Text style={styles.postText}>Uploading...</Text>
            </View>
          ) : (
            <Text style={styles.postText}>Post Video</Text>
          )}
        </Pressable>

        {uploadState === 'uploading' && (
          <Text style={styles.uploadHint}>
            Please wait while your video is being posted.
          </Text>
        )}

        {uploadState === 'error' && (
          <Animated.View
            style={[styles.errorBox, { opacity: errorOpacity }]}
          >
            <Ionicons
              name="alert-circle"
              size={22}
              color={colors.danger}
            />

            <Text style={styles.errorText}>{message}</Text>
          </Animated.View>
        )}

        {uploadState === 'success' && (
          <Animated.View
            style={[styles.successBox, { opacity: successOpacity }]}
          >
            <Ionicons
              name="checkmark-circle"
              size={23}
              color={colors.success}
            />

            <Text style={styles.successText}>{message}</Text>
          </Animated.View>
        )}

        <View style={styles.thinkBox}>
          <Text style={styles.thinkTitle}>THINK ABOUT THE USER</Text>

          <Text style={styles.thinkText}>
            Why should the Post button be disabled while uploading? What
            should happen if permission is denied? How does previewing the
            video reduce mistakes before posting?
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  topBar: {
    height: 58,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  title: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 17,
  },

  topBarSpacer: {
    width: 29,
  },

  contentScroll: {
    flex: 1,
  },

  content: {
    padding: 16,
    paddingBottom: 36,
    flexGrow: 1,
  },

  pickButton: {
    minHeight: 50,
    borderRadius: 10,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  pickText: {
    color: colors.text,
    fontWeight: '800',
  },

  previewCard: {
    marginTop: 16,
  },

  previewHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  sectionLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  preview: {
    width: '100%',
    aspectRatio: 9 / 16,
    maxHeight: 460,
    backgroundColor: '#050608',
    borderRadius: 12,
  },

  previewHint: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 8,
  },

  emptyPreview: {
    marginTop: 16,
    minHeight: 250,
    borderRadius: 12,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 10,
  },

  emptyText: {
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 6,
    maxWidth: 340,
  },

  input: {
    minHeight: 92,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    marginTop: 16,
    padding: 14,
    color: colors.text,
    textAlignVertical: 'top',
  },

  postButton: {
    backgroundColor: colors.blue,
    borderRadius: 10,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingHorizontal: 16,
  },

  postButtonDisabled: {
    opacity: 0.55,
  },

  postText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 15,
  },

  uploadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },

  uploadHint: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 9,
  },

  errorBox: {
    marginTop: 14,
    borderRadius: 10,
    padding: 13,
    backgroundColor: '#2B171B',
    borderWidth: 1,
    borderColor: '#5F272E',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  errorText: {
    color: '#FFD6DA',
    flex: 1,
    lineHeight: 20,
  },

  successBox: {
    marginTop: 14,
    borderRadius: 10,
    padding: 13,
    backgroundColor: '#13281F',
    borderWidth: 1,
    borderColor: '#285641',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  successText: {
    color: '#D8F8E8',
    flex: 1,
    lineHeight: 20,
  },

  thinkBox: {
    marginTop: 20,
    borderRadius: 10,
    padding: 14,
    backgroundColor: colors.panel2,
  },

  thinkTitle: {
    color: colors.live,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.1,
  },

  thinkText: {
    color: colors.text,
    lineHeight: 20,
    marginTop: 6,
  },
});
