import AsyncStorage from "@react-native-async-storage/async-storage";
// types
import { IUserData, IUsersData } from "@/types/context/user";
// utils
import secureStore from "@/utils/secure-store";

// const
const newUser = {
    stay_sign_in: "",
    access_token: "",
    id_token: "",
    entitlements_token: "",
    sub: "",
    tdid: "",
    asid: "",
    clid: "",
    ssid: "",
    game_name: "",
    tag_line: "",
    pp: "",
    radianite_point: "",
    valorant_point: "",
    kingdom_credit: "",
    logged: false,
    rank: "",
    rr: "",
    level: "",
    xp: "",
    player_card_id: "",
};

const user = {
    async getUserInfo(key: keyof IUserData): Promise<string | null | boolean> {
        const currentUser = await AsyncStorage.getItem("current_user");
        if (!currentUser) return false;

        const users = await secureStore.getItem("users");
        if (!users) return "";

        const usersData: IUsersData = JSON.parse(users);
        return usersData?.[currentUser]?.[key] ?? "";
    },

    async removeUser(userKey: string): Promise<void> {
        const users = await secureStore.getItem("users");
        if (!users) return;

        const usersData: IUsersData = JSON.parse(users);
        if (usersData?.[userKey]) {
            delete usersData[userKey];
            await secureStore.setItem("users", JSON.stringify(usersData));
        }

        const currentUser = await AsyncStorage.getItem("current_user");
        const defaultUser = await AsyncStorage.getItem("default_user");
        if (currentUser === userKey) await AsyncStorage.removeItem("current_user");
        if (defaultUser === userKey) await AsyncStorage.removeItem("default_user");

        const order = await user.getUserOrder();
        const updatedOrder = order.filter(u => u !== userKey);
        await user.setUserOrder(updatedOrder);
    },

    async setDefaultUser(username: string): Promise<void> {
        await AsyncStorage.setItem("default_user", username);
    },

    async getDefaultUser(): Promise<string | null> {
        return await AsyncStorage.getItem("default_user");
    },

    async setUserOrder(order: string[]): Promise<void> {
        await AsyncStorage.setItem("user_order", JSON.stringify(order));
    },

    async getUserOrder(): Promise<string[]> {
        const raw = await AsyncStorage.getItem("user_order");
        return raw ? JSON.parse(raw) : [];
    },

    async logoutAll(): Promise<void> {
        await secureStore.removeItem("users");
        await AsyncStorage.multiRemove([
            "current_user",
            "default_user",
            "user_order"
        ]);
    },
};

export default user;
