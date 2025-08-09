import React from "react";
import { TouchableRipple } from "react-native-paper";
import { Image, StyleSheet, View } from "react-native";
// components
import SvgLock from "@/components/icon/lock";
import SvgFavorite from "@/components/icon/favorite";
// contexts
import useThemeContext from "@/contexts/hook/use-theme-context";
import useProfileContext from "@/contexts/hook/use-profile-context";
// types
import { WeaponChroma, WeaponSkin } from "@/types/api/shop/weapon-skin";
// utils
import { hexToRgba } from "@/utils/color";

type Props = {
  currentSkin: WeaponSkin;
  currentChromaIndex: number;
  handleChromaPress: (index: number, fullRender: string) => void;
};

const CollectionChromaList: React.FC<Props> = ({ currentChromaIndex, currentSkin, handleChromaPress }) => {
  const { palette } = useThemeContext();
  const { skinVariants, favoriteSkins } = useProfileContext();

  const renderChroma = (chroma: WeaponChroma, index: number) => {
    const isCurrentChroma = currentChromaIndex === index;
    const isLocked = !skinVariants?.Entitlements.some((variant) => variant.ItemID === chroma.uuid);
    const isFavorite = Object.keys(favoriteSkins?.FavoritedContent || {}).includes(chroma.uuid);

    return (
      <TouchableRipple
        borderless
        key={index}
        onPress={() => handleChromaPress(index, chroma.fullRender)}
        style={[
          styles.chromaItem,
          {
            backgroundColor: palette.card,
            borderColor: isCurrentChroma ? palette.primary : palette.card,
          },
        ]}
        rippleColor={hexToRgba(palette.primary, 0.2)}
      >
        <>
          <Image source={{ uri: chroma.swatch }} style={styles.chromaImage} />
          {isLocked && index !== 0 && (
            <View
              style={[
                styles.overlayBase,
                { backgroundColor: hexToRgba(palette.text, 0.2), alignItems: "center", justifyContent: "center" },
              ]}
            >
              <SvgLock color={palette.text} width={32} height={32} />
            </View>
          )}
          {isFavorite && (
            <View
              style={[
                styles.overlayBase,
                { backgroundColor: hexToRgba(palette.text, 0.5), alignItems: "center", justifyContent: "center" },
              ]}
            >
              <SvgFavorite color="#FFE500" width={32} height={32} />
            </View>
          )}
        </>
      </TouchableRipple>
    );
  };

  return <View style={styles.chromaContainer}>{currentSkin.chromas.map(renderChroma)}</View>;
};

const styles = StyleSheet.create({
  chromaContainer: {
    gap: 16,
    flexDirection: "row",
  },
  chromaItem: {
    width: 64,
    height: 64,
    padding: 4,
    borderWidth: 2,
    borderRadius: 22,
    position: "relative",
    justifyContent: "center",
  },
  chromaImage: {
    width: 52,
    height: 52,
    borderRadius: 16,
  },
  overlayBase: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default React.memo(CollectionChromaList);
