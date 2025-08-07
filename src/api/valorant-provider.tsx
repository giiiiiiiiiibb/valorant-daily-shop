import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
// types
import { AccountXPResponse } from "@/types/api/account-xp";
import { FavoriteSkin } from "@/types/api/favorite-skin";
import { PlayerInfoResponse } from "@/types/api/auth/user-info";
import { PlayerLoadoutGun, PlayerLoadoutResponse } from "@/types/api/player-loadout";
import { OwnedItem } from "@/types/api/owned-items";
import { StorefrontResponse } from "@/types/api/shop";
import { WalletResponse } from "@/types/api/user-balance";
// utils
import user from "@/utils/users";
import secureStore from "@/utils/secure-store";

// ----------------------------------------------------------------------

const BASE_URL = "https://pd.{region}.a.pvp.net";
const X_RIOT_CLIENT_PLATFORM = "ew0KCSJwbGF0Zm9ybVR5cGUiOiAiUEMiLA0KCSJwbGF0Zm9ybU9TIjogIldpbmRvd3MiLA0KCSJwbGF0Zm9ybU9TVmVyc2lvbiI6ICIxMC4wLjE5MDQyLjEuMjU2LjY0Yml0IiwNCgkicGxhdGZvcm1DaGlwc2V0IjogIlVua25vd24iDQp9";

const getAuthHeaders = async () => {
    const [accessToken, entitlementsToken, riotVersion] = await Promise.all([
        user.getUserInfo("access_token"),
        user.getUserInfo("entitlements_token"),
        secureStore.getItem("riot_version"),
    ]);

    return {
        Authorization: `Bearer ${accessToken}`,
        "X-Riot-Entitlements-JWT": entitlementsToken,
        "X-Riot-ClientPlatform": X_RIOT_CLIENT_PLATFORM,
        "X-Riot-ClientVersion": riotVersion,
    };
};

const request = async (options: AxiosRequestConfig<any>) => {
    try {
        return await axios.request(options);
    } catch (err: any) {
        if (err?.response?.status !== 404) {
            console.warn(`Request failed (${options.url}): ${err?.message}`);
        }
        return undefined;
    }
};

// ----------------------------------------------------------------------

const valorantProvider = {
    getUserInfo: async () => {
        const accessToken = await secureStore.getItem("access_token");
        const headers = { Authorization: `Bearer ${accessToken}` };

        const response: AxiosResponse<PlayerInfoResponse> = await request({ method: "GET", url: "https://auth.riotgames.com/userinfo", headers });
        if (!response) return;

        const { game_name, tag_line, sub } = response.data.acct;
        if (!game_name || !tag_line || !sub) return;

        await AsyncStorage.setItem("current_user", `${game_name}#${tag_line}`);
        await user.setUserInfo("game_name", game_name);
        await user.setUserInfo("tag_line", tag_line);
        await user.setUserInfo("sub", sub);

        await Promise.all(["access_token", "id_token", "entitlements_token"].map(async (key) => {
            const token = await secureStore.getItem(key);
            if (token) await user.setUserInfo(key, token);
        }));
    },

    getRiotGeo: async () => {
        const [accessToken, idToken] = await Promise.all([
            user.getUserInfo("access_token"),
            user.getUserInfo("id_token"),
        ]);

        const response = await request({
            method: "PUT",
            url: "https://riot-geo.pas.si.riotgames.com/pas/v1/product/valorant",
            headers: { Authorization: `Bearer ${accessToken}` },
            data: { id_token: idToken },
        });

        if (response?.data?.affinities?.live) {
            await user.setUserInfo("pp", response.data.affinities.live);
        }
    },

    getRiotVersion: async () => {
        const response = await request({ method: "GET", url: "https://valorant-api.com/v1/version" });
        if (response?.data?.data?.riotClientVersion) {
            await secureStore.setItem("riot_version", response.data.data.riotClientVersion);
        }
    },

    getUserBalance: async () => {
        const [sub, pp] = await Promise.all([
            user.getUserInfo("sub"),
            user.getUserInfo("pp"),
        ]);
        const headers = await getAuthHeaders();

        const response: AxiosResponse<WalletResponse> = await request({
            method: "GET",
            url: `${BASE_URL.replace("{region}", pp)}/store/v1/wallet/${sub}`,
            headers,
        });

        const balances = response?.data?.Balances;
        if (!balances) return;

        const mapped = {
            radianite_point: balances["e59aa87c-4cbf-517a-5983-6e81511be9b7"]?.toString(),
            valorant_point: balances["85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741"]?.toString(),
            kingdom_credit: balances["85ca954a-41f2-ce94-9b45-8ca3dd39a00d"]?.toString(),
        };

        for (const [k, v] of Object.entries(mapped)) {
            if (v) await user.setUserInfo(k, v);
        }
    },

    getFrontShop: async () => {
        const [sub, pp] = await Promise.all([
            user.getUserInfo("sub"),
            user.getUserInfo("pp"),
        ]);
        const headers = await getAuthHeaders();

        const response: AxiosResponse<StorefrontResponse> = await request({
            method: "POST",
            url: `${BASE_URL.replace("{region}", pp)}/store/v3/storefront/${sub}`,
            headers,
            data: {},
        });

        const data = response?.data;
        if (!data?.SkinsPanelLayout?.SingleItemStoreOffers) return;

        return {
            plugins: data.PluginStores,
            bundles: data.FeaturedBundle,
            offers: data.SkinsPanelLayout,
            nightMarket: data.BonusStore,
            accessoryStore: data.AccessoryStore,
        };
    },

    getBundle: async (id: string) => {
        const response = await request({ method: "GET", url: `https://valorant-api.com/v1/bundles/${id}` });
        return response?.data?.data;
    },

    getAccountXP: async () => {
        const [sub, pp] = await Promise.all([
            user.getUserInfo("sub"),
            user.getUserInfo("pp"),
        ]);
        const headers = await getAuthHeaders();

        const response: AxiosResponse<AccountXPResponse> = await request({
            method: "GET",
            url: `${BASE_URL.replace("{region}", pp)}/account-xp/v1/players/${sub}`,
            headers,
        });

        if (response?.data?.Progress) {
            const { Level, XP } = response.data.Progress;
            await user.setUserInfo("level", Level.toString());
            await user.setUserInfo("xp", XP.toString());
        }
    },

    getPlayerLoadout: async () => {
        const [sub, pp] = await Promise.all([
            user.getUserInfo("sub"),
            user.getUserInfo("pp"),
        ]);
        const headers = await getAuthHeaders();

        const response: AxiosResponse<PlayerLoadoutResponse> = await request({
            method: "GET",
            url: `${BASE_URL.replace("{region}", pp)}/personalization/v2/players/${sub}/playerloadout`,
            headers,
        });

        const playerCardId = response?.data?.Identity?.PlayerCardID;
        if (playerCardId) {
            await user.setUserInfo("player_card_id", playerCardId);
        }

        return response?.data;
    },

    getOwnedItems: async (itemTypeId: string) => {
        const [sub, pp] = await Promise.all([
            user.getUserInfo("sub"),
            user.getUserInfo("pp"),
        ]);
        const headers = await getAuthHeaders();

        const response: AxiosResponse<OwnedItem> = await request({
            method: "GET",
            url: `${BASE_URL.replace("{region}", pp)}/store/v1/entitlements/${sub}/${itemTypeId}`,
            headers,
        });

        return response?.data;
    },

    getPlayerRankAndRR: async () => {
        const [gameName, tagLine, pp] = await Promise.all([
            user.getUserInfo("game_name"),
            user.getUserInfo("tag_line"),
            user.getUserInfo("pp"),
        ]);

        const response: AxiosResponse = await request({
            method: "GET",
            url: `https://api.kyroskoh.xyz/valorant/v1/mmr/${pp}/${gameName}/${tagLine}`,
        });

        if (response?.data) {
            const parts = response.data.split(" - ");
            await user.setUserInfo("rank", parts[0]);
            await user.setUserInfo("rr", parts[1]?.split("RR")[0]);
        }
    },

    getPlayerFavoriteSkin: async () => {
        const [sub, pp] = await Promise.all([user.getUserInfo("sub"), user.getUserInfo("pp")]);
        const headers = await getAuthHeaders();

        const response: AxiosResponse<FavoriteSkin> = await request({
            method: "GET",
            url: `${BASE_URL.replace("{region}", pp)}/favorites/v1/players/${sub}/favorites`,
            headers,
        });

        return response?.data;
    },

    addPlayerFavoriteSkin: async (itemID: string) => {
        const [sub, pp] = await Promise.all([user.getUserInfo("sub"), user.getUserInfo("pp")]);
        const headers = await getAuthHeaders();

        const response = await request({
            method: "POST",
            url: `${BASE_URL.replace("{region}", pp)}/favorites/v1/players/${sub}/favorites`,
            headers,
            data: { ItemID: itemID },
        });

        return response?.data;
    },

    deletePlayerFavoriteSkin: async (itemID: string) => {
        const [sub, pp] = await Promise.all([user.getUserInfo("sub"), user.getUserInfo("pp")]);
        const headers = await getAuthHeaders();

        const response = await request({
            method: "DELETE",
            url: `${BASE_URL.replace("{region}", pp)}/favorites/v1/players/${sub}/favorites/${itemID.replace(/-/g, "")}`,
            headers,
        });

        return response?.data;
    },

    setPlayerLoadout: async (playerLoadout: PlayerLoadoutResponse, ID: string, skinID: string, skinLevelID: string, chromaID: string) => {
        const [sub, pp] = await Promise.all([user.getUserInfo("sub"), user.getUserInfo("pp")]);
        const headers = await getAuthHeaders();

        const cleanLoadout = { ...playerLoadout };
        delete (cleanLoadout as any)["Subject"];
        delete (cleanLoadout as any)["Version"];

        cleanLoadout.Guns = cleanLoadout.Guns.map((gun: PlayerLoadoutGun) =>
            gun.ID === ID
                ? { ID, SkinID: skinID, SkinLevelID: skinLevelID, ChromaID: chromaID, Attachments: [] }
                : gun
        );

        const response: AxiosResponse<PlayerLoadoutResponse> = await request({
            method: "PUT",
            url: `${BASE_URL.replace("{region}", pp)}/personalization/v2/players/${sub}/playerloadout`,
            headers,
            data: cleanLoadout,
        });

        return response?.data;
    },
};

export default valorantProvider;
