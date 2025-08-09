import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
// contexts
import useThemeContext from "@/contexts/hook/use-theme-context";
import usePluginContext from "@/contexts/hook/use-plugin-context";
import useNightMarketContext from "@/contexts/hook/use-night-market-context";
// screens
import BundleView from "@/screens/shop/bundle";
import DailyShop from "@/screens/shop/daily-shop";
import NightMarket from "@/screens/shop/night-market";
import PluginStore from "@/screens/shop/plugin-store";
import AccessoryStore from "@/screens/shop/accessory-store";
// utils
import { hexToRgba } from "@/utils/color";

const Tab = createMaterialTopTabNavigator();

const Store = () => {
  const { palette } = useThemeContext();
  const { plugins } = usePluginContext();
  const { nightMarket } = useNightMarketContext();

  const tabNavigatorOptions = useMemo(
    () => ({
      initialRouteName: "Daily shop",
      screenOptions: {
        tabBarGap: 8,
        tabBarItemStyle: styles.tabBarItem,
        tabBarStyle: [styles.tabBar, { backgroundColor: palette.background }],
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarScrollEnabled: true,
        tabBarActiveTintColor: palette.text,
        tabBarInactiveTintColor: hexToRgba(palette.text, 0.6),
        tabBarIndicatorStyle: {
          backgroundColor: palette.primary,
          borderTopLeftRadius: 50,
          borderTopRightRadius: 50,
        },
        tabBarIndicatorContainerStyle: {
          marginLeft: 8,
        },
        lazy: true, // Enable lazy loading
      },
    }),
    [palette.background, palette.text, palette.primary]
  );

  return (
    <View style={styles.container}>
      <Tab.Navigator {...tabNavigatorOptions}>
        <Tab.Screen name="Bundles" component={BundleView} />
        <Tab.Screen name="Daily shop" component={DailyShop} />
        <Tab.Screen name="Accessory shop" component={AccessoryStore} />
        {nightMarket?.BonusStoreOffers && <Tab.Screen name="Night market" component={NightMarket} />}
        {plugins && <Tab.Screen name="E-sport" component={PluginStore} />}
      </Tab.Navigator>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBarItem: {
    width: "auto",
    minWidth: 110,
    paddingHorizontal: 4,
  },
  tabBar: {
    paddingHorizontal: 8,
  },
  tabBarLabel: {
    fontSize: 16,
    letterSpacing: 0.5,
    lineHeight: 24,
    marginHorizontal: 0,
    fontFamily: "Nota",
  },
});

export default React.memo(Store);
