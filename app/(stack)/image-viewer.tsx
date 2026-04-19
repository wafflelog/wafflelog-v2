import { colors, getColor } from "@/constants/theme";
import { Image as ExpoImage } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { X as XIcon } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const ZOOM_ANIMATION_DURATION = 300;

export default function ImageZoomScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ url?: string }>();

  const images = [
    "https://picsum.photos/seed/695/3000/2000",
    "https://picsum.photos/seed/696/3000/2000",
    "https://picsum.photos/seed/697/3000/2000",
    "https://picsum.photos/seed/698/3000/2000",
    "https://picsum.photos/seed/699/3000/2000",
  ];

  const [imageUrl, setImageUrl] = useState(images[0]);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  const resetTransform = useCallback(() => {
    scale.value = withTiming(MIN_SCALE, { duration: ZOOM_ANIMATION_DURATION });
    translateX.value = withTiming(0, { duration: ZOOM_ANIMATION_DURATION });
    translateY.value = withTiming(0, { duration: ZOOM_ANIMATION_DURATION });
    savedScale.value = MIN_SCALE;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  }, [
    scale,
    translateX,
    translateY,
    savedScale,
    savedTranslateX,
    savedTranslateY,
  ]);

  useEffect(() => {
    setImageSize({ width: 0, height: 0 });
    resetTransform();
  }, [imageUrl, resetTransform]);

  const handleImageLoad = useCallback(
    (event: { source: { width: number; height: number } }) => {
      const { width, height } = event.source;
      if (width > 0 && height > 0) {
        setImageSize({ width, height });
        resetTransform();
      }
    },
    [resetTransform],
  );

  // Pinch gesture for zoom
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      const newScale = Math.max(
        MIN_SCALE,
        Math.min(MAX_SCALE, savedScale.value * event.scale),
      );
      scale.value = newScale;

      // Center image if scale is at minimum
      if (newScale <= MIN_SCALE) {
        translateX.value = 0;
        translateY.value = 0;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value < MIN_SCALE) {
        scale.value = withTiming(MIN_SCALE, {
          duration: ZOOM_ANIMATION_DURATION,
        });
        savedScale.value = MIN_SCALE;
      }
      if (scale.value > MAX_SCALE) {
        scale.value = withTiming(MAX_SCALE, {
          duration: ZOOM_ANIMATION_DURATION,
        });
        savedScale.value = MAX_SCALE;
      }

      // Center image if scale is at minimum
      if (scale.value <= MIN_SCALE) {
        translateX.value = withTiming(0, { duration: ZOOM_ANIMATION_DURATION });
        translateY.value = withTiming(0, { duration: ZOOM_ANIMATION_DURATION });
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    });

  // Pan gesture for dragging when zoomed
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // Don't allow panning when at minimum scale
      if (scale.value <= MIN_SCALE) {
        translateX.value = 0;
        translateY.value = 0;
        return;
      }

      if (imageSize.width === 0 || imageSize.height === 0) {
        return;
      }

      const maxTranslateX = Math.max(
        0,
        (imageSize.width * scale.value - SCREEN_WIDTH) / 2,
      );
      const maxTranslateY = Math.max(
        0,
        (imageSize.height * scale.value - SCREEN_HEIGHT) / 2,
      );

      translateX.value = Math.max(
        -maxTranslateX,
        Math.min(maxTranslateX, savedTranslateX.value + event.translationX),
      );
      translateY.value = Math.max(
        -maxTranslateY,
        Math.min(maxTranslateY, savedTranslateY.value + event.translationY),
      );
    })
    .onEnd(() => {
      // Center if at minimum scale
      if (scale.value <= MIN_SCALE) {
        translateX.value = 0;
        translateY.value = 0;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      }
    });

  // Double tap to zoom
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((event) => {
      if (imageSize.width === 0 || imageSize.height === 0) {
        return;
      }

      if (scale.value > MIN_SCALE) {
        // Zoom out - center the image
        scale.value = withTiming(MIN_SCALE, {
          duration: ZOOM_ANIMATION_DURATION,
        });
        translateX.value = withTiming(0, { duration: ZOOM_ANIMATION_DURATION });
        translateY.value = withTiming(0, { duration: ZOOM_ANIMATION_DURATION });
        savedScale.value = MIN_SCALE;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        // Zoom in to 2x at tap location
        const targetScale = 2;
        scale.value = withTiming(targetScale, {
          duration: ZOOM_ANIMATION_DURATION,
        });
        savedScale.value = targetScale;

        // Calculate translation to center on tap point
        const focalX = event.x - SCREEN_WIDTH / 2;
        const focalY = event.y - SCREEN_HEIGHT / 2;

        const maxTranslateX = Math.max(
          0,
          (imageSize.width * targetScale - SCREEN_WIDTH) / 2,
        );
        const maxTranslateY = Math.max(
          0,
          (imageSize.height * targetScale - SCREEN_HEIGHT) / 2,
        );

        translateX.value = withTiming(
          Math.max(-maxTranslateX, Math.min(maxTranslateX, -focalX * 0.5)),
          { duration: ZOOM_ANIMATION_DURATION },
        );
        translateY.value = withTiming(
          Math.max(-maxTranslateY, Math.min(maxTranslateY, -focalY * 0.5)),
          { duration: ZOOM_ANIMATION_DURATION },
        );

        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      }
    });

  const composedGesture = Gesture.Race(
    doubleTapGesture,
    Gesture.Simultaneous(pinchGesture, panGesture),
  );

  const animatedStyle = useAnimatedStyle(() => {
    // Always center when scale is at minimum
    const finalTranslateX = scale.value <= MIN_SCALE ? 0 : translateX.value;
    const finalTranslateY = scale.value <= MIN_SCALE ? 0 : translateY.value;

    return {
      transform: [
        { translateX: finalTranslateX },
        { translateY: finalTranslateY },
        { scale: scale.value },
      ],
    };
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <XIcon size={24} color={getColor(colors.white)} />
        </TouchableOpacity>
        <View style={styles.overlay}>
          <GestureDetector gesture={composedGesture}>
            <Animated.View style={[styles.imageContainer, animatedStyle]}>
              <ExpoImage
                source={imageUrl}
                style={styles.image}
                contentFit="contain"
                onLoad={handleImageLoad}
                transition={200}
              />
            </Animated.View>
          </GestureDetector>
        </View>

        <FlatList
          horizontal
          style={styles.thumbnails}
          data={images}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => setImageUrl(item)}>
              <ExpoImage source={{ uri: item }} style={styles.thumbnail} />
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    backgroundColor: getColor(colors.black),
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 0, // Important for flex to work properly
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: getColor(colors.white, 0.2),
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  thumbnails: {
    height: 100,
    flexShrink: 0,
    flexGrow: 0,
  },
  thumbnail: {
    width: 100,
    height: 100,
  },
});
