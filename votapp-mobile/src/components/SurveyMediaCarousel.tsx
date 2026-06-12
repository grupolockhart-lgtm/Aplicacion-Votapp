// src/components/SurveyMediaCarousel.tsx
import React, { useRef, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  Image,
} from "react-native";
import FeedMedia from "@/components/FeedMedia";
import FeedMediaYoutube from "@/components/FeedMediaYoutube";

const { width } = Dimensions.get("window");

interface MediaItem {
  url: string;
  type: "native" | "webview" | "image";
}

interface Props {
  media: MediaItem[];
  globalMuted: boolean;
  toggleMute: () => void;
  isActive: boolean;
}

export default function SurveyMediaCarousel({
  media,
  globalMuted,
  toggleMute,
  isActive,
}: Props) {
  const scrollX = useRef(new Animated.Value(0)).current;
  const [activeIndex, setActiveIndex] = useState(0);
  const [imageHeights, setImageHeights] = useState<number[]>([]);

  const handleScrollEnd = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  };

  // calcular alturas dinámicas para todas las imágenes
  useEffect(() => {
    Promise.all(
      media.map(
        (item) =>
          new Promise<number>((resolve) => {
            if (item.type === "image") {
              Image.getSize(
                item.url,
                (w, h) => resolve((h / w) * width),
                () => resolve(width * 0.56) // fallback 16:9
              );
            } else {
              resolve(width * 0.56);
            }
          })
      )
    ).then((heights) => setImageHeights(heights));
  }, [media]);

  return (
    <View style={styles.container}>
      <Animated.FlatList
        data={media}
        horizontal
        pagingEnabled
        style={{ flexGrow: 0 }}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={width}
        snapToAlignment="center"
        keyExtractor={(_, index) => index.toString()}
        onMomentumScrollEnd={handleScrollEnd}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        renderItem={({ item, index }) => (
          <View style={[styles.slide]}>
            {item.type === "native" ? (
              <FeedMedia
                media_url={item.url}
                isActive={isActive && activeIndex === index}
                globalMuted={globalMuted}
                toggleMute={toggleMute}
              />
            ) : item.type === "webview" ? (
              <FeedMediaYoutube source_url={item.url} />
            ) : (
              <Image
                source={{ uri: item.url }}
                style={{
                  width,
                  height: imageHeights[index] ?? width * 0.56,
                }}
                resizeMode="contain"
              />
            )}
          </View>
        )}
      />

      <View style={styles.dotsContainer}>
        {media.map((_, i) => {
          const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
          const dotOpacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: "clamp",
          });
          const dotScale = scrollX.interpolate({
            inputRange,
            outputRange: [0.8, 1.4, 0.8],
            extrapolate: "clamp",
          });
          return (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                { opacity: dotOpacity, transform: [{ scale: dotScale }] },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width, position: "relative" },
  slide: { width, justifyContent: "center", alignItems: "center" },
  dotsContainer: {
    position: "absolute",
    bottom: 10,
    flexDirection: "row",
    alignSelf: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2563EB",
    marginHorizontal: 4,
  },
});