import React, { useMemo } from "react";
import { TouchableRipple } from "react-native-paper";
import { FlatList, StyleSheet, View } from "react-native";
// components
import SvgLock from "@/components/icon/lock";
import SvgCheck from "@/components/icon/check";
import Text from "@/components/typography/text";
// contexts
import useThemeContext from "@/contexts/hook/use-theme-context";
import useProfileContext from "@/contexts/hook/use-profile-context";
// types
import { PlayerLoadoutGun } from "@/types/api/player-loadout";
import { WeaponLevel, WeaponSkin } from "@/types/api/shop/weapon-skin";
// utils
import { addSpaceBeforeUpperCase } from "@/utils/format-string";
import { hexToRgba } from "@/utils/color";

type Props = {
  skin: WeaponSkin;
  currentSkin: WeaponSkin;
  currentLevelIndex?: number;
  playerLoadoutGun: PlayerLoadoutGun;
  handleLevelPress: (index: number) => void;
};

const CollectionLevelList: React.FC<Props> = ({
  skin,
  currentSkin,
  currentLevelIndex,
  playerLoadoutGun,
  handleLevelPress,
}) => {
  const { palette } = useThemeContext();
  const { skins } = useProfileContext();

  const indicatorStyle = useMemo<"white" | "black">(
    () => (palette.background === "#FFFFFF" ? "black" : "white"),
    [/* eslint-disable-line react-hooks/exhaustive-deps */ palette.background]
  );

  const renderLevelItem = ({ item, index }: { item: WeaponLevel; index: number }) => {
    const isCurrentLevel = index === currentLevelIndex;
    const isLocked = !skins?.Entitlements.some((entitlement) => entitlement.ItemID === item.uuid);

    let levelIndex = -1;
    if (currentSkin.uuid === skin.uuid) {
      levelIndex = currentSkin.levels.findIndex((level) => level.uuid === playerLoadoutGun.SkinLevelID);
    }

    return (
      <TouchableRipple
        borderless
        key={item.uuid}
        onPress={() => handleLevelPress(index)}
        rippleColor={hexToRgba(palette.primary, 0.2)}
        style={[
          styles.levelItem,
          { backgroundColor: isCurrentLevel ? hexToRgba(palette.primary, 0.55) : palette.card },
        ]}
      >
        <>
          <Text variant="headlineSmall">Level {index + 1}</Text>
          {item.levelItem && (
            <Text variant="bodyLarge" style={styles.levelText}>
              {addSpaceBeforeUpperCase(item.levelItem.split("::")[1])}
            </Text>
          )}
          {isLocked && (
            <View style={[styles.checkOverlay, { backgroundColor: hexToRgba(palette.text, 0.08) }]}>
              <SvgLock color={palette.text} width={32} height={32} />
            </View>
          )}
          {levelIndex >= index && (
            <View style={[styles.checkOverlay, { backgroundColor: hexToRgba(palette.text, 0.08) }]}>
              <SvgCheck color={palette.text} width={32} height={32} />
            </View>
          )}
        </>
      </TouchableRipple>
    );
  };

  return (
    <FlatList
      overScrollMode="never"
      style={styles.flatList}
      data={currentSkin.levels}
      renderItem={renderLevelItem}
      showsVerticalScrollIndicator={false}
      keyExtractor={(item) => item.uuid}
      contentContainerStyle={styles.flatListContent}
      indicatorStyle={indicatorStyle}
    />
  );
};

const styles = StyleSheet.create({
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
    position: "relative",
  },
  levelText: {
    opacity: 0.5,
  },
  checkOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "flex-end",
    justifyContent: "center",
    padding: 16,
  },
});

export default React.memo(CollectionLevelList);
