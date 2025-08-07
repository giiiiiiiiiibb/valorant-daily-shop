import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
// types
import { OwnedItem } from "@/types/api/owned-items";
import { StorefrontResponse } from "@/types/api/shop";
import { FavoriteSkin } from "@/types/api/favorite-skin";
import { WalletResponse } from "@/types/api/user-balance";
import { AccountXPResponse } from "@/types/api/account-xp";
import { PlayerInfoResponse } from "@/types/api/auth/user-info";
import { PlayerLoadoutGun, PlayerLoadoutResponse } from "@/types/api/player-loadout";
import { BundleInfo } from "@/types/api/community/bundles"; // must be created if missing
// utils
import user from "@/utils/users";
import secureStore from "@/utils/secure-store";

const X_Riot_ClientPlatform = 'ew0KCSJwbGF0Zm9ybVR5cGUiOiAiUEMiLA0KCSJwbGF0Zm9ybU9TIjogIldpbmRvd3MiLA0KCSJwbGF0Zm9ybU9TVmVyc2lvbiI6ICIxMC4wLjE5MDQyLjEuMjU2LjY0Yml0IiwNCgkicGxhdGZvcm1DaGlwc2V0IjogIlVua25vd24iDQp9';

const requestWithHeaders = async (options: AxiosRequestConfig<any>) => {
  try {
    return await axios.request(options);
  } catch (error: any) {
    if (options?.url?.includes("token") || options?.headers?.Authorization) {
      console.warn(`[SafeRequest] Failed on ${options.url}`);
    } else {
      console.error(`Error in ${options.url}:`, error);
    }
    throw error;
  }
};

const buildAuthHeaders = async (): Promise<Record<string, string>> => {
  const [accessToken, entitlementsToken, riotVersion] = await Promise.all([
    user.getUserInfo("access_token"),
    user.getUserInfo("entitlements_token"),
    secureStore.getItem("riot_version"),
  ]);

  if (!accessToken || !entitlementsToken || !riotVersion) {
    throw new Error("Missing required tokens");
  }

  return {
    Authorization: `Bearer ${accessToken}`,
    "X-Riot-Entitlements-JWT": entitlementsToken,
    "X-Riot-ClientPlatform": X_Riot_ClientPlatform,
    "X-Riot-ClientVersion": riotVersion,
  };
};

const valorantProvider = {
  getUserInfo: async () => {
    const accessToken = await secureStore.getItem("access_token");
    if (!accessToken) throw new Error("Access token not found");

    const response: AxiosResponse<PlayerInfoResponse> = await requestWithHeaders({
      method: "GET",
      url: "https://auth.riotgames.com/userinfo",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const { game_name, tag_line, sub } = response.data.acct;
    if (game_name && tag_line && sub) {
      await AsyncStorage.setItem("current_user", `${game_name}#${tag_line}`);
      await Promise.all([
        user.setUserInfo("game_name", game_name),
        user.setUserInfo("tag_line", tag_line),
        user.setUserInfo("sub", sub),
      ]);

      for (const key of ["access_token", "id_token", "entitlements_token"]) {
        const value = await secureStore.getItem(key);
        if (value) await user.setUserInfo(key, value);
      }
    }
  },

  getRiotGeo: async () => {
    const [accessToken, idToken] = await Promise.all([
      user.getUserInfo("access_token"),
      user.getUserInfo("id_token"),
    ]);

    const response = await requestWithHeaders({
      method: "PUT",
      url: "https://riot-geo.pas.si.riotgames.com/pas/v1/product/valorant",
      data: { id_token: idToken },
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    await user.setUserInfo("pp", response.data.affinities.live);
  },

  getRiotVersion: async () => {
    const response = await requestWithHeaders({
      method: "GET",
      url: "https://valorant-api.com/v1/version",
    });

    await secureStore.setItem("riot_version", response.data.data.riotClientVersion);
  },

  getUserBalance: async () => {
    const [sub, pp] = await Promise.all([
      user.getUserInfo("sub"),
      user.getUserInfo("pp"),
    ]);
    const headers = await buildAuthHeaders();

    const response: AxiosResponse<WalletResponse> = await requestWithHeaders({
      method: "GET",
      url: `https://pd.${pp}.a.pvp.net/store/v1/wallet/${sub}`,
      headers,
    });

    const balances = response.data.Balances;
    await Promise.all([
      user.setUserInfo("radianite_point", balances["e59aa87c-4cbf-517a-5983-6e81511be9b7"].toString()),
      user.setUserInfo("valorant_point", balances["85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741"].toString()),
      user.setUserInfo("kingdom_credit", balances["85ca954a-41f2-ce94-9b45-8ca3dd39a00d"].toString()),
    ]);
  },

  getFrontShop: async () => {
    const [sub, pp] = await Promise.all([
      user.getUserInfo("sub"),
      user.getUserInfo("pp"),
    ]);
    const headers = await buildAuthHeaders();

    const response: AxiosResponse<StorefrontResponse> = await requestWithHeaders({
      method: "POST",
      url: `https://pd.${pp}.a.pvp.net/store/v3/storefront/${sub}`,
      headers,
      data: "{}",
    });

    if (!response?.data) throw new Error("Empty storefront response");

    return {
      plugins: response.data.PluginStores,
      bundles: response.data.FeaturedBundle,
      offers: response.data.SkinsPanelLayout,
      nightMarket: response.data?.BonusStore,
      accessoryStore: response.data.AccessoryStore,
    };
  },

  getBundleByName: async (name: string, allBundles: BundleInfo[]) => {
    return allBundles?.find(b => b.displayName === name);
  },

  getAccountXP: async () => {
    const [sub, pp] = await Promise.all([
      user.getUserInfo("sub"),
      user.getUserInfo("pp"),
    ]);
    const headers = await buildAuthHeaders();

    const response: AxiosResponse<AccountXPResponse> = await requestWithHeaders({
      method: "GET",
      url: `https://pd.${pp}.a.pvp.net/account-xp/v1/players/${sub}`,
      headers,
    });

    await Promise.all([
      user.setUserInfo("level", response.data.Progress.Level.toString()),
      user.setUserInfo("xp", response.data.Progress.XP.toString()),
    ]);
  },

  getPlayerLoadout: async () => {
    const [sub, pp] = await Promise.all([
      user.getUserInfo("sub"),
      user.getUserInfo("pp"),
    ]);
    const headers = await buildAuthHeaders();

    const response: AxiosResponse<PlayerLoadoutResponse> = await requestWithHeaders({
      method: "GET",
      url: `https://pd.${pp}.a.pvp.net/personalization/v2/players/${sub}/playerloadout`,
      headers,
    });

    await user.setUserInfo("player_card_id", response.data.Identity.PlayerCardID);
    return response.data;
  },

  setPlayerLoadout: async (
    playerLoadout: PlayerLoadoutResponse,
    ID: string,
    skinID: string,
    skinLevelID: string,
    chromaID: string
  ) => {
    const [sub, pp] = await Promise.all([
      user.getUserInfo("sub"),
      user.getUserInfo("pp"),
    ]);
    const headers = await buildAuthHeaders();

    delete (playerLoadout as any)["Subject"];
    delete (playerLoadout as any)["Version"];

    const updatedGuns = playerLoadout.Guns.map((gun: PlayerLoadoutGun) => {
      if (gun.ID === ID) {
        return { ID, SkinID: skinID, SkinLevelID: skinLevelID, ChromaID: chromaID, Attachments: [] };
      }
      return gun;
    });

    const response: AxiosResponse<PlayerLoadoutResponse> = await requestWithHeaders({
      method: "PUT",
      url: `https://pd.${pp}.a.pvp.net/personalization/v2/players/${sub}/playerloadout`,
      headers,
      data: { ...playerLoadout, Guns: updatedGuns },
    });

    return response.data;
  },

  getPlayerFavoriteSkin: async () => {
    const [sub, pp] = await Promise.all([
      user.getUserInfo("sub"),
      user.getUserInfo("pp"),
    ]);
    const headers = await buildAuthHeaders();

    const response: AxiosResponse<FavoriteSkin> = await requestWithHeaders({
      method: "GET",
      url: `https://pd.${pp}.a.pvp.net/favorites/v1/players/${sub}/favorites`,
      headers,
    });

    return response.data;
  },

  addPlayerFavoriteSkin: async (itemID: string) => {
    const [sub, pp] = await Promise.all([
      user.getUserInfo("sub"),
      user.getUserInfo("pp"),
    ]);
    const headers = await buildAuthHeaders();

    const response = await requestWithHeaders({
      method: "POST",
      url: `https://pd.${pp}.a.pvp.net/favorites/v1/players/${sub}/favorites`,
      headers,
      data: { ItemID: itemID },
    });

    return response.data;
  },

  deletePlayerFavoriteSkin: async (itemID: string) => {
    const [sub, pp] = await Promise.all([
      user.getUserInfo("sub"),
      user.getUserInfo("pp"),
    ]);
    const headers = await buildAuthHeaders();

    const response = await requestWithHeaders({
      method: "DELETE",
      url: `https://pd.${pp}.a.pvp.net/favorites/v1/players/${sub}/favorites/${itemID.replace(/-/g, "")}`,
      headers,
    });

    return response.data;
  },

  getPlayerRankAndRR: async () => {
    const [gameName, tagLine, pp] = await Promise.all([
      user.getUserInfo("game_name"),
      user.getUserInfo("tag_line"),
      user.getUserInfo("pp"),
    ]);

    try {
      const response: AxiosResponse = await requestWithHeaders({
        method: "GET",
        url: `https://api.kyroskoh.xyz/valorant/v1/mmr/${pp}/${gameName}/${tagLine}`,
      });

      if (response.data) {
        const [rank, rest] = response.data.split(" - ");
        const rr = rest?.split("RR")[0];
        await user.setUserInfo("rank", rank);
        await user.setUserInfo("rr", rr);
      }
    } catch {
      // Silently fail
    }
  },

  getOwnedItems: async (itemTypeId: string) => {
    const [sub, pp] = await Promise.all([
      user.getUserInfo("sub"),
      user.getUserInfo("pp"),
    ]);
    const headers = await buildAuthHeaders();

    const response: AxiosResponse<OwnedItem> = await requestWithHeaders({
      method: "GET",
      url: `https://pd.${pp}.a.pvp.net/store/v1/entitlements/${sub}/${itemTypeId}`,
      headers,
    });

    return response.data;
  },
};

export default valorantProvider;
