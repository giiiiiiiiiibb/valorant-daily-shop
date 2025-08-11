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
// utils
import user from "@/utils/users";
import secureStore from "@/utils/secure-store";

// Static headers
const X_RIOT_CLIENT_PLATFORM = "ew0KCSJwbGF0Zm9ybVR5cGUiOiAiUEMiLA0KCSJwbGF0Zm9ybU9TIjogIldpbmRvd3MiLA0KCSJwbGF0Zm9ybU9TVmVyc2lvbiI6ICIxMC4wLjE5MDQyLjEuMjU2LjY0Yml0IiwNCgkicGxhdGZvcm1DaGlwc2V0IjogIlVua25vd24iDQp9";

// Riot currency UUIDs
const BALANCE_IDS = {
  RP: "e59aa87c-4cbf-517a-5983-6e81511be9b7",
  VP: "85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741",
  KC: "85ca954a-41f2-ce94-9b45-8ca3dd39a00d",
} as const;

// Shared helpers
/** Wrap axios request to avoid logging sensitive payloads. */
const requestWithHeaders = async <T = any>(options: AxiosRequestConfig<any>): Promise<AxiosResponse<T>> => {
  try {
    return await axios.request<T>(options);
  } catch (error: any) {
    // Do not dump raw error; provide small, non-sensitive context.
    const status = error?.response?.status;
    const url = options?.url;
    // eslint-disable-next-line no-console
    console.warn(`[requestWithHeaders] Request failed (${status ?? "no-status"}) for ${url ?? "unknown"}`);
    throw error;
  }
};

/**
 * Fetch required auth values. Returns nulls rather than falsy booleans to avoid
 * accidental Authorization: "Bearer false".
 */
const readAuthContext = async () => {
  const [accessToken, entitlementsToken, idToken, sub, pp, riotVersion] = await Promise.all([
    secureStore.getItem("access_token"),
    secureStore.getItem("entitlements_token"),
    secureStore.getItem("id_token"),
    user.getUserInfo("sub"),
    user.getUserInfo("pp"),
    secureStore.getItem("riot_version"),
  ]);

  return {
    accessToken: accessToken || null,
    entitlementsToken: entitlementsToken || null,
    idToken: (typeof idToken === "string" && idToken) || null,
    sub: (typeof sub === "string" && sub) || null,
    pp: (typeof pp === "string" && pp) || null,
    riotVersion: riotVersion || null,
  };
};

/** Ensure auth is present before calling protected endpoints. */
const assertAuthReady = (ctx: Awaited<ReturnType<typeof readAuthContext>>): asserts ctx is {
  accessToken: string;
  entitlementsToken: string;
  idToken: string;
  sub: string;
  pp: string;
  riotVersion: string;
} => {
  if (!ctx.accessToken || !ctx.idToken) throw new Error("AUTH_MISSING_TOKEN");
  if (!ctx.sub) throw new Error("AUTH_MISSING_SUB");
  if (!ctx.pp) throw new Error("AUTH_MISSING_REGION");
  if (!ctx.entitlementsToken) throw new Error("AUTH_MISSING_ENTITLEMENTS");
  if (!ctx.riotVersion) throw new Error("AUTH_MISSING_VERSION");
};

const valorantProvider = {
  /** Reads userinfo and persists the core identity/state into per-user storage. */
  getUserInfo: async () => {
    const accessToken = await secureStore.getItem("access_token");
    if (!accessToken) throw new Error("AUTH_MISSING_TOKEN");

    const options: AxiosRequestConfig = {
      method: "GET",
      url: "https://auth.riotgames.com/userinfo",
      headers: { Authorization: `Bearer ${accessToken}` },
    };

    const response: AxiosResponse<PlayerInfoResponse> = await requestWithHeaders(options);

    const { acct, sub } = response.data || {};
    if (acct?.game_name && acct?.tag_line && sub) {
      const currentUser = `${acct.game_name}#${acct.tag_line}`;
      await AsyncStorage.setItem("current_user", currentUser);

      await user.setUserInfo("game_name", acct.game_name);
      await user.setUserInfo("tag_line", acct.tag_line);
      await user.setUserInfo("sub", sub);

      // Persist tokens per user for future silent re-use. Never log them.
      const [a, i, e] = await Promise.all([
        secureStore.getItem("access_token"),
        secureStore.getItem("id_token"),
        secureStore.getItem("entitlements_token"),
      ]);
      if (a) await user.setUserInfo("access_token", a);
      if (i) await user.setUserInfo("id_token", i);
      if (e) await user.setUserInfo("entitlements_token", e);
    }
  },

  /**
   * Resolve Riot Geo. This endpoint is sensitive to stale tokens.
   * We strictly validate inputs and surface a clean error if 401.
   */
  getRiotGeo: async (): Promise<void> => {
    const ctx = await readAuthContext();
    if (!ctx.accessToken || !ctx.idToken) throw new Error("AUTH_MISSING_TOKEN_FOR_GEO");

    const options: AxiosRequestConfig = {
      method: "PUT",
      url: "https://riot-geo.pas.si.riotgames.com/pas/v1/product/valorant",
      data: { id_token: ctx.idToken },
      headers: { Authorization: `Bearer ${ctx.accessToken}` },
    };

    try {
      const response = await requestWithHeaders(options);
      const region = response?.data?.affinities?.live;
      if (typeof region === "string" && region) {
        await user.setUserInfo("pp", region);
      } else {
        // If API shape changes, fail softly—downstream calls will guard on pp
        // eslint-disable-next-line no-console
        console.warn("[getRiotGeo] Live affinity not found in response");
      }
    } catch (err: any) {
      if (err?.response?.status === 401) {
        // Token is invalid/expired – let the caller decide whether to attempt re-auth.
        throw new Error("AUTH_UNAUTHORIZED_GEO");
      }
      throw err;
    }
  },

  getRiotVersion: async (): Promise<void> => {
    const options: AxiosRequestConfig = { method: "GET", url: "https://valorant-api.com/v1/version" };
    const response = await requestWithHeaders(options);
    const version = response?.data?.data?.riotClientVersion;
    if (typeof version === "string" && version) {
      await secureStore.setItem("riot_version", version);
    } else {
      // eslint-disable-next-line no-console
      console.warn("[getRiotVersion] riotClientVersion not present");
    }
  },

  getUserBalance: async (): Promise<void> => {
    const ctx = await readAuthContext();
    assertAuthReady(ctx);

    const options: AxiosRequestConfig = {
      method: "GET",
      url: `https://pd.${ctx.pp}.a.pvp.net/store/v1/wallet/${ctx.sub}`,
      headers: {
        Authorization: `Bearer ${ctx.accessToken}`,
        "X-Riot-Entitlements-JWT": ctx.entitlementsToken,
        "X-Riot-ClientPlatform": X_RIOT_CLIENT_PLATFORM,
        "X-Riot-ClientVersion": ctx.riotVersion,
      },
    };

    const response: AxiosResponse<WalletResponse> = await requestWithHeaders(options);
    const balances = response?.data?.Balances || {};

    await user.setUserInfo("radianite_point", String(balances[BALANCE_IDS.RP] ?? "0"));
    await user.setUserInfo("valorant_point", String(balances[BALANCE_IDS.VP] ?? "0"));
    await user.setUserInfo("kingdom_credit", String(balances[BALANCE_IDS.KC] ?? "0"));
  },

  getFrontShop: async () => {
    const ctx = await readAuthContext();
    assertAuthReady(ctx);

    const options: AxiosRequestConfig = {
      method: "POST",
      url: `https://pd.${ctx.pp}.a.pvp.net/store/v3/storefront/${ctx.sub}`,
      data: {}, // avoid sending "{}" as a string
      headers: {
        Authorization: `Bearer ${ctx.accessToken}`,
        "X-Riot-Entitlements-JWT": ctx.entitlementsToken,
        "X-Riot-ClientPlatform": X_RIOT_CLIENT_PLATFORM,
        "X-Riot-ClientVersion": ctx.riotVersion,
      },
    };

    const response: AxiosResponse<StorefrontResponse> = await requestWithHeaders(options);

    const { SkinsPanelLayout, FeaturedBundle, BonusStore, PluginStores, AccessoryStore } = response.data || {};
    if (SkinsPanelLayout?.SingleItemStoreOffers) {
      return {
        plugins: PluginStores,
        bundles: FeaturedBundle,
        offers: SkinsPanelLayout,
        nightMarket: BonusStore,
        accessoryStore: AccessoryStore,
      };
    }
    return undefined;
  },

  getBundle: async (id: string) => {
    if (!id) return undefined;
    const options: AxiosRequestConfig = {
      method: "GET",
      url: `https://valorant-api.com/v1/bundles/${encodeURIComponent(id)}`,
    };
    const response = await requestWithHeaders(options);
    return response?.data?.data;
  },

  getAccountXP: async () => {
    const ctx = await readAuthContext();
    assertAuthReady(ctx);

    const options: AxiosRequestConfig = {
      method: "GET",
      url: `https://pd.${ctx.pp}.a.pvp.net/account-xp/v1/players/${ctx.sub}`,
      headers: {
        Authorization: `Bearer ${ctx.accessToken}`,
        "X-Riot-Entitlements-JWT": ctx.entitlementsToken,
        "X-Riot-ClientPlatform": X_RIOT_CLIENT_PLATFORM,
        "X-Riot-ClientVersion": ctx.riotVersion,
      },
    };

    const response: AxiosResponse<AccountXPResponse> = await requestWithHeaders(options);
    const lvl = response?.data?.Progress?.Level;
    const xp = response?.data?.Progress?.XP;

    if (Number.isFinite(lvl)) await user.setUserInfo("level", String(lvl));
    if (Number.isFinite(xp)) await user.setUserInfo("xp", String(xp));
  },

  getPlayerLoadout: async () => {
    const ctx = await readAuthContext();
    assertAuthReady(ctx);

    const options: AxiosRequestConfig = {
      method: "GET",
      url: `https://pd.${ctx.pp}.a.pvp.net/personalization/v2/players/${ctx.sub}/playerloadout`,
      headers: {
        Authorization: `Bearer ${ctx.accessToken}`,
        "X-Riot-Entitlements-JWT": ctx.entitlementsToken,
        "X-Riot-ClientPlatform": X_RIOT_CLIENT_PLATFORM,
        "X-Riot-ClientVersion": ctx.riotVersion,
      },
    };

    const response: AxiosResponse<PlayerLoadoutResponse> = await requestWithHeaders(options);
    const cardId = response?.data?.Identity?.PlayerCardID;
    if (typeof cardId === "string") await user.setUserInfo("player_card_id", cardId);

    return response.data;
  },

  getPlayerRankAndRR: async () => {
    const [gameName, tagLine, pp] = await Promise.all([
      user.getUserInfo("game_name"),
      user.getUserInfo("tag_line"),
      user.getUserInfo("pp"),
    ]);

    if (typeof gameName !== "string" || typeof tagLine !== "string" || typeof pp !== "string") {
      return;
    }

    const options: AxiosRequestConfig = {
      method: "GET",
      url: `https://api.kyroskoh.xyz/valorant/v1/mmr/${pp}/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
    };

    try {
      const response: AxiosResponse = await requestWithHeaders(options);
      const data = response?.data;
      if (typeof data === "string" && data.includes(" - ")) {
        const [rank, rrPart] = data.split(" - ");
        const rr = rrPart?.split("RR")?.[0];
        if (rank) await user.setUserInfo("rank", rank);
        if (rr) await user.setUserInfo("rr", rr);
      }
    } catch {
      // Non-critical enrichment; ignore failures silently
    }
  },

  getOwnedItems: async (itemTypeId: string) => {
    const ctx = await readAuthContext();
    assertAuthReady(ctx);
    if (!itemTypeId) throw new Error("OWNED_ITEMS_MISSING_TYPE");

    const options: AxiosRequestConfig = {
      method: "GET",
      url: `https://pd.${ctx.pp}.a.pvp.net/store/v1/entitlements/${ctx.sub}/${itemTypeId}`,
      headers: {
        Authorization: `Bearer ${ctx.accessToken}`,
        "X-Riot-Entitlements-JWT": ctx.entitlementsToken,
        "X-Riot-ClientPlatform": X_RIOT_CLIENT_PLATFORM,
        "X-Riot-ClientVersion": ctx.riotVersion,
      },
    };

    const response: AxiosResponse<OwnedItem> = await requestWithHeaders(options);
    return response.data;
  },

  setPlayerLoadout: async (
    playerLoadout: PlayerLoadoutResponse,
    ID: string,
    skinID: string,
    skinLevelID: string,
    chromaID: string
  ) => {
    const ctx = await readAuthContext();
    assertAuthReady(ctx);

    const clean: any = { ...playerLoadout };
    delete clean.Subject;
    delete clean.Version;

    const options: AxiosRequestConfig = {
      method: "PUT",
      url: `https://pd.${ctx.pp}.a.pvp.net/personalization/v2/players/${ctx.sub}/playerloadout`,
      headers: {
        Authorization: `Bearer ${ctx.accessToken}`,
        "X-Riot-Entitlements-JWT": ctx.entitlementsToken,
        "X-Riot-ClientPlatform": X_RIOT_CLIENT_PLATFORM,
        "X-Riot-ClientVersion": ctx.riotVersion,
      },
      data: {
        ...clean,
        Guns: clean.Guns.map((gun: PlayerLoadoutGun) =>
          gun.ID === ID
            ? {
                ID,
                SkinID: skinID,
                SkinLevelID: skinLevelID,
                ChromaID: chromaID,
                Attachments: [],
              }
            : gun
        ),
      },
    };

    const response: AxiosResponse<PlayerLoadoutResponse> = await requestWithHeaders(options);
    return response.data;
  },

  getPlayerFavoriteSkin: async () => {
    const ctx = await readAuthContext();
    assertAuthReady(ctx);

    const options: AxiosRequestConfig = {
      method: "GET",
      url: `https://pd.${ctx.pp}.a.pvp.net/favorites/v1/players/${ctx.sub}/favorites`,
      headers: {
        Authorization: `Bearer ${ctx.accessToken}`,
        "X-Riot-Entitlements-JWT": ctx.entitlementsToken,
        "X-Riot-ClientPlatform": X_RIOT_CLIENT_PLATFORM,
        "X-Riot-ClientVersion": ctx.riotVersion,
      },
    };

    const response: AxiosResponse<FavoriteSkin> = await requestWithHeaders(options);
    return response.data;
  },

  addPlayerFavoriteSkin: async (itemID: string) => {
    const ctx = await readAuthContext();
    assertAuthReady(ctx);
    if (!itemID) throw new Error("FAVORITES_MISSING_ITEM");

    const options: AxiosRequestConfig = {
      method: "POST",
      url: `https://pd.${ctx.pp}.a.pvp.net/favorites/v1/players/${ctx.sub}/favorites`,
      headers: {
        Authorization: `Bearer ${ctx.accessToken}`,
        "X-Riot-Entitlements-JWT": ctx.entitlementsToken,
        "X-Riot-ClientPlatform": X_RIOT_CLIENT_PLATFORM,
        "X-Riot-ClientVersion": ctx.riotVersion,
      },
      data: { ItemID: itemID },
    };

    const response = await requestWithHeaders(options);
    return response.data;
  },

  deletePlayerFavoriteSkin: async (itemID: string) => {
    const ctx = await readAuthContext();
    assertAuthReady(ctx);
    if (!itemID) throw new Error("FAVORITES_MISSING_ITEM");

    const options: AxiosRequestConfig = {
      method: "DELETE",
      url: `https://pd.${ctx.pp}.a.pvp.net/favorites/v1/players/${ctx.sub}/favorites/${itemID.replace(/-/g, "")}`,
      headers: {
        Authorization: `Bearer ${ctx.accessToken}`,
        "X-Riot-Entitlements-JWT": ctx.entitlementsToken,
        "X-Riot-ClientPlatform": X_RIOT_CLIENT_PLATFORM,
        "X-Riot-ClientVersion": ctx.riotVersion,
      },
    };

    const response = await requestWithHeaders(options);
    return response.data;
  },
};

export default valorantProvider;
