import AsyncStorage from "@react-native-async-storage/async-storage";
import secureStore from "@/utils/secure-store";
// types
import { IUserData, IUsersData } from "@/types/context/user";

/**
 * Stored user template: create missing keys deterministically
 */
const newUser: IUserData = {
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

const USERS_KEY = "users";

/** Small in-memory hint to cheaply check presence without decrypting */
let hasUsersCache: boolean | null = null;

const user = {
  /**
   * Fast check for presence (for headers/toggles). Not authoritative.
   * Will become accurate after first load.
   */
  peekHasUsersSync(): boolean {
    return !!hasUsersCache;
  },

  async getAllUsers(): Promise<IUsersData> {
    const users = await secureStore.getItem(USERS_KEY);
    if (!users) {
      hasUsersCache = false;
      return {};
    }
    try {
      const parsed: IUsersData = JSON.parse(users);
      hasUsersCache = Object.keys(parsed).length > 0;
      return parsed;
    } catch {
      hasUsersCache = false;
      return {};
    }
  },

  async clearAllUsers(): Promise<void> {
    await secureStore.removeItem(USERS_KEY);
    hasUsersCache = false;
  },

  async removeUser(userKey: string): Promise<void> {
    const usersRaw = await secureStore.getItem(USERS_KEY);
    if (!usersRaw) return;
    try {
      const users: IUsersData = JSON.parse(usersRaw);
      if (users[userKey]) {
        delete users[userKey];
        await secureStore.setItem(USERS_KEY, JSON.stringify(users));
        hasUsersCache = Object.keys(users).length > 0;
      }
    } catch {
      // ignore
    }
  },

  async setUserInfo(key: keyof IUserData, value: string | boolean): Promise<void> {
    const currentUser = await AsyncStorage.getItem("current_user");
    if (!currentUser) return;

    let users: IUsersData = {};
    const usersRaw = await secureStore.getItem(USERS_KEY);
    if (usersRaw) {
      try {
        users = JSON.parse(usersRaw);
      } catch {
        users = {};
      }
    }

    if (!users[currentUser]) {
      users[currentUser] = { ...newUser };
    }

    // @ts-ignore - dynamic assignment
    users[currentUser][key] = value;
    await secureStore.setItem(USERS_KEY, JSON.stringify(users));
    hasUsersCache = Object.keys(users).length > 0;
  },

  async getUserInfo(key: keyof IUserData): Promise<string | null | boolean> {
    const currentUser = await AsyncStorage.getItem("current_user");
    if (!currentUser) return false;
    return this.getUserInfoFor(currentUser, key);
  },

  async getUserInfoFor(username: string, key: keyof IUserData): Promise<string | null | boolean> {
    const usersRaw = await secureStore.getItem(USERS_KEY);
    if (!usersRaw) return "";
    try {
      const users: IUsersData = JSON.parse(usersRaw);
      if (users[username] && users[username][key] != null) {
        // @ts-ignore
        return users[username][key];
      }
      return "";
    } catch {
      return "";
    }
  },
};

export default user;
