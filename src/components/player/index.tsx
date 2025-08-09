import { Video } from "expo-av";
import { VideoProps } from "expo-av/src/Video.types";
import { IconButton, TouchableRipple } from "react-native-paper";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, LayoutChangeEvent, StyleSheet, View } from "react-native";
// theme
import useThemeContext from "@/contexts/hook/use-theme-context";
// utils
import { hexToRgba } from "@/utils/color";

type PlayerProps = VideoProps & {
  onClose: () => void;
};

const Player: React.FC<PlayerProps> = ({ source, onClose, ...props }) => {
  const { palette } = useThemeContext();
  const videoRef = useRef<Video>(null);

  const [isLoading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [videoEnd, setVideoEnd] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [videoLayout, setVideoLayout] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setLoading(true);
    setIsPlaying(true);
    setVideoEnd(false);
    setShowControls(false);
  }, [source]);

  const togglePlayPause = useCallback(async () => {
    if (isPlaying) {
      await videoRef.current?.pauseAsync();
    } else {
      await videoRef.current?.playAsync();
    }
    setIsPlaying((prev) => !prev);
  }, [isPlaying]);

  const replayVideo = useCallback(async () => {
    await videoRef.current?.replayAsync();
    setIsPlaying(true);
    setVideoEnd(false);
    setShowControls(false);
  }, []);

  const toggleShowControls = useCallback(() => setShowControls((prev) => !prev), []);

  const onVideoLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setVideoLayout({ width, height });
  }, []);

  const { key, ...rest } = props;

  return (
    <View style={{ ...styles.container, height: videoLayout.height }}>
      <TouchableRipple onPress={toggleShowControls} borderless style={styles.ripple} rippleColor={hexToRgba(palette.text, 0.05)}>
        <>
          {isLoading && (
            <View style={[styles.overlay, { backgroundColor: hexToRgba(palette.background, 0.5), zIndex: 1 }]}>
              <ActivityIndicator size="large" color={palette.primary} />
            </View>
          )}
          <Video
            ref={videoRef}
            source={source}
            shouldPlay={isPlaying}
            onLayout={onVideoLayout}
            onLoadStart={() => setLoading(true)}
            onReadyForDisplay={() => setLoading(false)}
            onPlaybackStatusUpdate={(status) => {
              if (!status.isLoaded) {
                setLoading(true);
              } else if (status.didJustFinish) {
                setVideoEnd(true);
                setIsPlaying(false);
              }
            }}
            {...rest}
          />
          {(showControls || videoEnd) && (
            <View style={[styles.overlay, { backgroundColor: hexToRgba(palette.background, 0.5), height: videoLayout.height, zIndex: 2, flexDirection: "row" }]}>
              <IconButton
                size={48}
                icon="replay"
                mode="contained"
                onPress={replayVideo}
                iconColor={palette.text}
                style={{ backgroundColor: palette.primary }}
              />
              {!videoEnd && (
                <IconButton
                  size={48}
                  mode="contained"
                  iconColor={palette.text}
                  onPress={togglePlayPause}
                  icon={isPlaying ? "pause" : "play"}
                  style={{ backgroundColor: palette.primary }}
                />
              )}
            </View>
          )}
        </>
      </TouchableRipple>
      <View style={styles.closeButton}>
        <IconButton
          icon="close"
          onPress={onClose}
          iconColor={palette.background}
          style={{ backgroundColor: palette.text }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { position: "relative" },
  ripple: { borderRadius: 16 },
  overlay: {
    top: 0, left: 0, right: 0, bottom: 0,
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  closeButton: {
    top: 0,
    right: 0,
    zIndex: 999,
    position: "absolute",
  },
});

export default Player;
