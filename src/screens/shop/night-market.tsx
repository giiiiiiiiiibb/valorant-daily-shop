import React, { useMemo } from "react";
import { ScrollView, View, StyleSheet } from "react-native";
// contexts
import useThemeContext from "@/contexts/hook/use-theme-context";
import useNightMarketContext from "@/contexts/hook/use-night-market-context";
// components
import Text from "@/components/typography/text";
import Loading from "@/components/loading/loading";
// sections
import NightMarketCardItem from "@/sections/shop/night-market/night-market-card-item";
// utils
import { secondsToDhms } from "@/utils/format-time";

const NightMarket = () => {
  const { palette } = useThemeContext();
  const { nightMarket } = useNightMarketContext();

  if (!nightMarket || !nightMarket.BonusStoreOffers) {
    return <Loading />;
  }

  const nightMarketOffers = useMemo(
    () => (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        overScrollMode="never"
      >
        {nightMarket.BonusStoreOffers.map((offer, index) => (
          <NightMarketCardItem item={offer} key={index} />
        ))}
      </ScrollView>
    ),
    [nightMarket.BonusStoreOffers]
  );

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <View style={styles.header}>
        <Text variant="titleMedium" style={{ color: palette.text }}>
          TIME LEFT:
        </Text>
        <Text variant="titleMedium" style={{ color: palette.primary }}>
          {secondsToDhms(nightMarket?.BonusStoreRemainingDurationInSeconds ?? 0)}
        </Text>
      </View>
      {nightMarketOffers}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  scrollView: {
    paddingHorizontal: 16,
  },
  scrollViewContent: {
    rowGap: 16,
  },
});

export default React.memo(NightMarket);
