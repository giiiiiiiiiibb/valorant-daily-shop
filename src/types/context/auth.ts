import React from "react";

export type AuthState = "initializing" | "unauthenticated" | "authenticated";

export type SelectAccountResult = {
  needsInteractive: boolean; // true => open LoginWebView
};

export type IAuthContext = {
  // operations
  initialize: () => Promise<void>;
  selectAccount: (username: string) => Promise<SelectAccountResult>;
  loginInteractive: () => Promise<void>; // called by LoginWebView on success
  logoutUser: (username: string) => Promise<void>; // remove just this account from vault
  logoutAll: () => Promise<void>; // remove tokens + all accounts
  // state
  state: AuthState;
  currentUser: string | null;
};

export enum EAuthContextType {
  INIT = "INIT",
  INIT_DONE_UNAUTH = "INIT_DONE_UNAUTH",
  LOGIN_SUCCESS = "LOGIN_SUCCESS",
  LOGOUT_ALL = "LOGOUT_ALL",
}

export type IAuthAction =
  | { type: EAuthContextType.INIT }
  | { type: EAuthContextType.INIT_DONE_UNAUTH }
  | { type: EAuthContextType.LOGIN_SUCCESS; username: string | null }
  | { type: EAuthContextType.LOGOUT_ALL };
