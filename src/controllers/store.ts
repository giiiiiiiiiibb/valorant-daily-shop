import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
// api
import { rtkValorantApi } from "@/api/rtk-valorant-api";

/**
 * Centralized store factory (handy for testing / SSR in the future).
 * Keeps middleware checks enabled but tuned to ignore RTK Query internals
 * instead of disabling serializable checks entirely.
 */
export const makeStore = () =>
  configureStore({
    reducer: {
      [rtkValorantApi.reducerPath]: rtkValorantApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        immutableCheck: true,
        serializableCheck: {
          // Ignore RTK Query action types and paths that can be non-serializable
          ignoredActions: [
            // RTKQ internal actions:
            `${rtkValorantApi.reducerPath}/executeQuery/fulfilled`,
            `${rtkValorantApi.reducerPath}/executeQuery/rejected`,
            `${rtkValorantApi.reducerPath}/executeMutation/fulfilled`,
            `${rtkValorantApi.reducerPath}/executeMutation/rejected`,
          ],
          ignoredPaths: [
            `${rtkValorantApi.reducerPath}.queries`,
            `${rtkValorantApi.reducerPath}.mutations`,
          ],
        },
      }).concat(rtkValorantApi.middleware),
    devTools: typeof __DEV__ !== "undefined" ? __DEV__ : process.env.NODE_ENV !== "production",
  });

export const store = makeStore();

// Optional, but required to enable refetchOnFocus/refetchOnReconnect behaviors.
setupListeners(store.dispatch);

/**
 * Reset the RTK Query cache (use on logout).
 * Intentionally does not log any error payloads.
 */
export const resetStore = (): void => {
  try {
    store.dispatch(rtkValorantApi.util.resetApiState());
  } catch {
    // Swallow errors to avoid leaking sensitive info from error objects
  }
};

// Inferred types for strong typing across the app
export type AppStore = typeof store;
export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<AppStore["getState"]>;
