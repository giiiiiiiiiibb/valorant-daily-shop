import React, { useState } from "react";
import { createMaterialBottomTabNavigator } from "react-native-paper/react-navigation";
import AsyncStorage from "@react-native-async-storage/async-storage";
// components
import SvgShop from "@/components/icon/shop";
import SvgUser from "@/components/icon/user";
import SvgUsers from "@/components/icon/users";
import SvgSetting from "@/components/icon/setting";
// contexts
import useAuthContext from "@/contexts/hook/use-auth-context";
import useThemeContext from "@/contexts/hook/use-theme-context";
// routes
import TabHeader from "@/routes/navigation/tab-header";
import StoreStackScreen from "@/routes/store-stack-screen";
// screens
import ProfileScreen from "@/screens/profile/profile-screen";
import AccountsScreen from "@/screens/accounts";
import SettingsScreen from "@/screens/settings";
// types
import { EAuthContextType } from "@/types/context/auth";

const BottomNavigation = createMaterialBottomTabNavigator();

const TabBar = () => {
  const { palette } = useThemeContext();
  const { dispatch } = useAuthContext();
  const [activeTab, setActiveTab] = useState("Shops");

  return (
    <>
      <TabHeader activeTab={activeTab} />
      <BottomNavigation.Navigator
        sceneAnimationEnabled
        initialRouteName="Shops"
        inactiveColor="#7A7B7E"
        activeColor={palette.primary}
        sceneAnimationType="shifting"
        activeIndicatorStyle={{ backgroundColor: palette.card }}
        barStyle={{ justifyContent: "center", backgroundColor: palette.background }}
        screenListeners={{
          state: (e) => {
            const routeName = e.data.state.routes[e.data.state.index].name;
            setActiveTab(routeName);
          },
        }}
      >
        <BottomNavigation.Screen
          name="Shops"
          component={StoreStackScreen}
          options={{ tabBarIcon: ({ color }) => <SvgShop color={color} /> }}
        />
        <BottomNavigation.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ tabBarIcon: ({ color }) => <SvgUser color={color} /> }}
        />
        <BottomNavigation.Screen
          name="Accounts"
          component={AccountsScreen}
          options={{ tabBarIcon: ({ color }) => <SvgUsers color={color} /> }}
        />
        <BottomNavigation.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ tabBarIcon: ({ color }) => <SvgSetting color={color} /> }}
        />
      </BottomNavigation.Navigator>
    </>
  );
};

export default TabBar;
