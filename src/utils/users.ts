import AsyncStorage from "@react-native-async-storage/async-storage";
// utils
import secureStore from "@/utils/secure-store";
// types
import { IUserData } from "@/types/context/user";

const USER_LIST_KEY = "riot_users";
const DEFAULT_USER_KEY = "default_user";

const buildSecureKey = (uuid: string): string => `riot_tokens_${uuid}`;

const user = {
    async getAllUsers(): Promise<IUserData[]> {
        const raw = await AsyncStorage.getItem(USER_LIST_KEY);
        return raw ? JSON.parse(raw) : [];
    },

    async getDefaultUser(): Promise<string | null> {
        return await AsyncStorage.getItem(DEFAULT_USER_KEY);
    },

    getDefaultUserSync(): string | null {
        let value: string | null = null;
        AsyncStorage.getItem(DEFAULT_USER_KEY).then(v => value = v);
        return value;
    },

    async setDefaultUser(uuid: string): Promise<void> {
        await AsyncStorage.setItem(DEFAULT_USER_KEY, uuid);
    },

    async setUser(user: IUserData, tokens: Record<string, string>): Promise<void> {
        const users = await this.getAllUsers();
        const existing = users.findIndex(u => u.uuid === user.uuid);
        if (existing !== -1) users[existing] = user;
        else users.push(user);
        await AsyncStorage.setItem(USER_LIST_KEY, JSON.stringify(users));
        await secureStore.setItem(buildSecureKey(user.uuid), JSON.stringify(tokens));
    },

    async getUserTokens(uuid: string): Promise<Record<string, string> | null> {
        const data = await secureStore.getItem(buildSecureKey(uuid));
        return data ? JSON.parse(data) : null;
    },

    async logout(user: IUserData): Promise<void> {
        const users = await this.getAllUsers();
        const filtered = users.filter(u => u.uuid !== user.uuid);
        await AsyncStorage.setItem(USER_LIST_KEY, JSON.stringify(filtered));
        await secureStore.removeItem(buildSecureKey(user.uuid));

        const defaultUser = await this.getDefaultUser();
        if (defaultUser === user.uuid) await AsyncStorage.removeItem(DEFAULT_USER_KEY);
    },

    async logoutAll(): Promise<void> {
        const users = await this.getAllUsers();
        await Promise.all(users.map(u => secureStore.removeItem(buildSecureKey(u.uuid))));
        await AsyncStorage.multiRemove([USER_LIST_KEY, DEFAULT_USER_KEY]);
    },

    async reorderUsers(data: IUserData[]): Promise<void> {
        await AsyncStorage.setItem(USER_LIST_KEY, JSON.stringify(data));
    }
};

export default user;
