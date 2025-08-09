import { createApi, fetchBaseQuery, retry } from "@reduxjs/toolkit/query/react";
// types
import { Agents } from "@/types/api/agent";
import { Theme } from "@/types/api/shop/theme";
import { Weapon } from "@/types/api/shop/weapon";
import { BundleInfo } from "@/types/api/shop/bundle";
import { WeaponSkin, WeaponSkins } from "@/types/api/shop/weapon-skin";
import { Buddies, Buddy, PlayerCard, PlayerTitle, Spray } from "@/types/api/shop";

/** Generic API response envelope from valorant-api.com */
export type Response<T> = {
  data: T;
  status: number;
};

const BASE_URL = "https://valorant-api.com/v1";

/**
 * Narrow type helper for entities that have `levels[{ uuid }]`.
 * Makes the nested search safe and removes the need for ts-ignore/any.
 */
type HasLevels = {
  levels?: Array<{ uuid: string }>;
};

/** Find an item by nested `levels[].uuid` (used for skins and buddies). */
const findByNestedLevelUuid = <T extends HasLevels>(items: T[], levelId: string): T | undefined =>
  items.find((item) => Array.isArray(item.levels) && item.levels.some((lvl) => lvl.uuid === levelId));

/**
 * Base query with lightweight retry for transient network errors (max 2 retries).
 * Avoids logging raw error payloads.
 */
const baseQuery = retry(
  fetchBaseQuery({
    baseUrl: BASE_URL,
    // Only set headers we actually need; avoid Content-Type on GET to reduce CORS noise
    prepareHeaders: (headers) => {
      headers.set("Accept", "application/json");
      return headers;
    },
  }),
  { maxRetries: 2 }
);

// Static content: we can keep data longer to reduce duplicate fetches.
const DEFAULT_KEEP_UNUSED_SECONDS = 60 * 60; // 1 hour

export const rtkValorantApi = createApi({
  reducerPath: "valorantApi",
  baseQuery,
  // These resources are effectively static; no tag invalidation needed.
  endpoints: (builder) => ({
    getBundleById: builder.query<Response<BundleInfo>, string>({
      query: (id) => `/bundles/${encodeURIComponent(id)}`,
      keepUnusedDataFor: DEFAULT_KEEP_UNUSED_SECONDS,
    }),

    getWeaponByLevelId: builder.query<Response<WeaponSkin | undefined>, string>({
      // Fetch all skins once; RTKQ caches this result for subsequent level lookups.
      query: () => `/weapons/skins`,
      transformResponse: (response: Response<WeaponSkins>, _meta, levelId) => {
        const foundSkin = findByNestedLevelUuid(response.data, levelId);
        return foundSkin
          ? ({ status: 200, data: foundSkin } as const)
          : ({ status: 404, data: undefined } as const);
      },
      keepUnusedDataFor: DEFAULT_KEEP_UNUSED_SECONDS,
    }),

    getWeaponById: builder.query<Response<Weapon>, string>({
      query: (id) => `/weapons/${encodeURIComponent(id)}`,
      keepUnusedDataFor: DEFAULT_KEEP_UNUSED_SECONDS,
    }),

    getThemeById: builder.query<Response<Theme>, string>({
      query: (id) => `/themes/${encodeURIComponent(id)}`,
      keepUnusedDataFor: DEFAULT_KEEP_UNUSED_SECONDS,
    }),

    getPlayerCardId: builder.query<Response<PlayerCard>, string>({
      query: (id) => `/playercards/${encodeURIComponent(id)}`,
      keepUnusedDataFor: DEFAULT_KEEP_UNUSED_SECONDS,
    }),

    getSprayById: builder.query<Response<Spray>, string>({
      query: (id) => `/sprays/${encodeURIComponent(id)}`,
      keepUnusedDataFor: DEFAULT_KEEP_UNUSED_SECONDS,
    }),

    getTitleById: builder.query<Response<PlayerTitle>, string>({
      query: (id) => `/playertitles/${encodeURIComponent(id)}`,
      keepUnusedDataFor: DEFAULT_KEEP_UNUSED_SECONDS,
    }),

    getGunBuddyById: builder.query<Response<Buddy | undefined>, string>({
      // Fetch all buddies once; then resolve by level uuid locally.
      query: () => `/buddies`,
      transformResponse: (response: Response<Buddies>, _meta, levelId) => {
        const found = findByNestedLevelUuid(response.data, levelId);
        return found
          ? ({ status: 200, data: found } as const)
          : ({ status: 404, data: undefined } as const);
      },
      keepUnusedDataFor: DEFAULT_KEEP_UNUSED_SECONDS,
    }),

    getAgents: builder.query<Response<Agents>, void>({
      query: () => `/agents?isPlayableCharacter=true`,
      keepUnusedDataFor: DEFAULT_KEEP_UNUSED_SECONDS,
    }),
  }),
});

export const {
  useGetAgentsQuery,
  useGetThemeByIdQuery,
  useGetTitleByIdQuery,
  useGetSprayByIdQuery,
  useGetBundleByIdQuery,
  useGetWeaponByIdQuery,
  useGetPlayerCardIdQuery,
  useGetGunBuddyByIdQuery,
  useGetWeaponByLevelIdQuery,
} = rtkValorantApi;
