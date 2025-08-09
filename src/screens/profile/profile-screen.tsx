import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
// contexts
import useThemeContext from "@/contexts/hook/use-theme-context";
// screens
import AgentsView from "@/screens/profile/agents/agents-view";
import CollectionView from "@/screens/profile/collection/collection-view";
// utils
import { hexToRgba } from "@/utils/color";

const Tab = createMaterialTopTabNavigator();

const ProfileScreen = () => {
  const { palette } = useThemeContext();

  const tabNavigatorOptions = useMemo(
    () => ({
      initialRouteName: "Collections",
      screenOptions: {
        swipeEnabled: false,
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
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <Tab.Navigator {...tabNavigatorOptions}>
        <Tab.Screen name="Collection" component={CollectionView} />
        <Tab.Screen name="Agents" component={AgentsView} />
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

export default React.memo(ProfileScreen);
