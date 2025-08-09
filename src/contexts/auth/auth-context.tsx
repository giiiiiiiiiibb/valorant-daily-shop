import { createContext } from "react";
// types
import type { IAuthContext } from "@/types/context/auth";

export const initialAuthState: IAuthContext = {
  // fns
  initialize: async () => {},
  selectAccount: async () => ({ needsInteractive: true }),
  loginInteractive: async () => {},
  logoutUser: async () => {},
  logoutAll: async () => {},
  // state
  state: "initializing",
  currentUser: null,
};

export const AuthContext = createContext<IAuthContext>(initialAuthState);
