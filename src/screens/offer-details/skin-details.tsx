import { ResizeMode } from "expo-av";
import { TouchableRipple } from "react-native-paper";
import React, { useCallback, useMemo, useState } from "react";
import { Dimensions, FlatList, Image, ImageBackground, StyleSheet, View } from "react-native";
// components
import Player from "@/components/player";
import Text from "@/components/typography/text";
// contexts
import useThemeContext from "@/contexts/hook/use-theme-context";
// types
import { SkinDetailScreenProps } from "@/types/router/navigation";
// utils
import { getContentTierIcon } from "@/utils/content-tier-icon";
import { addSpaceBeforeUpperCase } from "@/utils/format-string";
import { hexToRgba } from "@/utils/color";

const WIDTH = Dimensions.get("window").width;

const SkinDetails = ({ route }: SkinDetailScreenProps) => {
  const { palette } = useThemeContext();
  const { skin, skinType, theme } = route.params;

  const [currentImage, setCurrentImage] = useState(
    skin.levels[0].displayIcon ?? skin.chromas[0].displayIcon ?? skin.chromas[0].fullRender
  );
  const [currentIndex, setCurrentIndex] = useState<number | undefined>();
  const [currentVideo, setCurrentVideo] = useState<string | null>(null);
  const [currentChromaIndex, setCurrentChromaIndex] = useState<number>(0);

  const handleChromaPress = useCallback((index: number, fullRender: string, streamedVideo: string | null) => {
    setCurrentChromaIndex(index);
    setCurrentImage(fullRender);
    setCurrentVideo(streamedVideo);
  }, []);

  const handleLevelPress = useCallback((index: number, streamedVideo: string | null) => {
    setCurrentVideo(streamedVideo);
    setCurrentIndex(index);
  }, []);

  const renderListChroma = useMemo(
    () => (
      <View style={styles.chromaContainer}>
        {skin.chromas.map((chroma, index) => (
          <TouchableRipple
            borderless
            key={index}
            style={[
              styles.chromaItem,
              {
                backgroundColor: palette.card,
                borderColor: currentChromaIndex === index ? palette.primary : palette.card,
              },
            ]}
            onPress={() => handleChromaPress(index, chroma.fullRender, chroma.streamedVideo)}
            rippleColor={hexToRgba(palette.primary, 0.2)}
          >
            <Image source={{ uri: chroma.swatch }} style={styles.chromaImage} />
          </TouchableRipple>
        ))}
      </View>
    ),
    [skin.chromas, currentChromaIndex, palette.card, palette.primary, handleChromaPress]
  );

  const renderList = useMemo(
    () => (
      <FlatList
        data={skin.levels}
        style={styles.flatList}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.flatListContent}
        renderItem={({ item, index }) => (
          <TouchableRipple
            borderless
            key={index}
            rippleColor={hexToRgba(palette.primary, 0.2)}
            onPress={() => handleLevelPress(index, item.streamedVideo)}
            style={[
              styles.levelItem,
              {
                backgroundColor: index === currentIndex ? hexToRgba(palette.primary, 0.55) : palette.card,
              },
            ]}
          >
            <>
              <Text variant="headlineSmall">Level {index + 1}</Text>
              {item.levelItem && (
                <Text variant="bodyLarge" style={styles.levelText}>
                  {addSpaceBeforeUpperCase(item?.levelItem?.split("::")[1])}
                </Text>
              )}
            </>
          </TouchableRipple>
        )}
      />
    ),
    [skin.levels, currentIndex, palette.primary, palette.card, handleLevelPress]
  );

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text numberOfLines={2} adjustsFontSizeToFit variant="displayLarge" style={styles.title}>
            {theme.displayName}
          </Text>
          <Text variant="titleLarge" style={[styles.subtitle, { color: palette.text }]}>
            {skinType}
          </Text>
        </View>
        <Image source={getContentTierIcon(skin.contentTierUuid)} style={styles.icon} />
      </View>
      <View style={styles.content}>
        <View style={styles.imageWrapper}>
          <ImageBackground source={{ uri: skin.wallpaper }} borderRadius={16}>
            {currentVideo ? (
              <Player
                shouldPlay
                useNativeControls={false}
                style={styles.videoPlayer}
                source={{ uri: currentVideo }}
                resizeMode={ResizeMode.COVER}
                onClose={() => {
                  setCurrentVideo(null);
                  setCurrentIndex(undefined);
                }}
              />
            ) : (
              <Image source={{ uri: currentImage }} style={styles.currentImage} resizeMode="contain" />
            )}
          </ImageBackground>
        </View>
        {skin.chromas.length > 1 && renderListChroma}
        {skin.levels.length > 1 && renderList}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
    flex: 1,
    paddingHorizontal: 16,
    flexDirection: "column",
  },
  header: {
    gap: 16,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontFamily: "Vandchrome",
  },
  subtitle: {
    opacity: 0.5,
    fontFamily: "Nota",
    textTransform: "uppercase",
  },
  icon: {
    width: 32,
    height: 32,
  },
  content: {
    flex: 1,
    gap: 16,
    display: "flex",
    overflow: "hidden",
    position: "relative",
    flexDirection: "column",
  },
  imageWrapper: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  videoPlayer: {
    minHeight: 200,
    maxWidth: WIDTH,
  },
  currentImage: {
    height: "100%",
    maxWidth: WIDTH,
    marginHorizontal: 16,
  },
  chromaContainer: {
    gap: 16,
    display: "flex",
    marginBottom: 16,
    flexDirection: "row",
  },
  chromaItem: {
    width: 64,
    height: 64,
    padding: 4,
    borderWidth: 2,
    borderRadius: 22,
    justifyContent: "center",
  },
  chromaImage: {
    width: 52,
    height: 52,
    borderRadius: 16,
  },
  flatList: {
    flex: 1,
  },
  flatListContent: {
    gap: 8,
    paddingBottom: 16,
  },
  levelItem: {
    padding: 16,
    borderRadius: 16,
  },
  levelText: {
    opacity: 0.5,
  },
});

export default React.memo(SkinDetails);
