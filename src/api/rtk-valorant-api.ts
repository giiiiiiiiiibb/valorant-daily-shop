import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
// types
import { Agents } from "@/types/api/agent";
import { Theme } from "@/types/api/shop/theme";
import { Weapon } from "@/types/api/shop/weapon";
import { BundleInfo } from "@/types/api/shop/bundle";
import { WeaponSkin, WeaponSkins } from "@/types/api/shop/weapon-skin";
import { Buddies, Buddy, PlayerCard, PlayerTitle, Spray } from "@/types/api/shop";

export type Response<T> = {
    data: T;
    status: number;
};

const BASE_URL = "https://valorant-api.com/v1/";

/**
 * Finds an item with a specific level ID inside its 'levels' array.
 */
const findItemByLevelId = <T extends { levels?: { uuid: string }[] }>(
    items: T[],
    levelId: string
): T | undefined => {
    return items.find(item => item.levels?.some(level => level.uuid === levelId));
};

/**
 * Centralized API definition using RTK Query
 */
export const rtkValorantApi = createApi({
    reducerPath: "valorantApi",
    baseQuery: fetchBaseQuery({
        baseUrl: BASE_URL,
        prepareHeaders: (headers) => {
            headers.set("Content-Type", "application/json");
            return headers;
        },
    }),
    endpoints: (builder) => ({
        // NOTE: Deprecated in favor of community bundle list + fuzzy matching
        getBundleById: builder.query<Response<BundleInfo>, string>({
            query: (id) => `/bundles/${id}`,
        }),

        getBundles: builder.query<Response<BundleInfo[]>, void>({
            query: () => `/bundles`,
        }),

        getWeaponByLevelId: builder.query<Response<WeaponSkin>, string>({
            query: () => `/weapons/skins`,
            // @ts-ignore
            transformResponse: (response: Response<WeaponSkins>, _meta, levelId) => {
                const foundSkin = findItemByLevelId(response.data, levelId);
                return foundSkin ? { status: 200, data: foundSkin } : { status: 404, data: undefined };
            },
            keepUnusedDataFor: 3600,
        }),

        getWeaponById: builder.query<Response<Weapon>, string>({
            query: (id) => `/weapons/${id}`,
        }),

        getThemeById: builder.query<Response<Theme>, string>({
            query: (id) => `/themes/${id}`,
        }),

        getPlayerCardById: builder.query<Response<PlayerCard>, string>({
            query: (id) => `/playercards/${id}`,
        }),

        getSprayById: builder.query<Response<Spray>, string>({
            query: (id) => `/sprays/${id}`,
        }),

        getTitleById: builder.query<Response<PlayerTitle>, string>({
            query: (id) => `/playertitles/${id}`,
        }),

        getGunBuddyByLevelId: builder.query<Response<Buddy>, string>({
            query: () => "/buddies",
            // @ts-ignore
            transformResponse: (response: Response<Buddies>, _meta, levelId) => {
                const foundBuddy = findItemByLevelId(response.data, levelId);
                return foundBuddy ? { status: 200, data: foundBuddy } : { status: 404, data: undefined };
            },
            keepUnusedDataFor: 3600,
        }),

        getAgents: builder.query<Response<Agents>, void>({
            query: () => "/agents?isPlayableCharacter=true",
        }),
    }),
});

// Export hooks
export const {
    useGetAgentsQuery,
    useGetBundlesQuery,
    useGetThemeByIdQuery,
    useGetTitleByIdQuery,
    useGetSprayByIdQuery,
    useGetBundleByIdQuery, // deprecated – consider removing
    useGetWeaponByIdQuery,
    useGetPlayerCardByIdQuery,
    useGetGunBuddyByLevelIdQuery,
    useGetWeaponByLevelIdQuery,
} = rtkValorantApi;
