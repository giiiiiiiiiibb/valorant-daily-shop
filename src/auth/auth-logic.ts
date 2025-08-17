import AsyncStorage from "@react-native-async-storage/async-storage";
// utils
import * as SecureStore from "@/utils/secure-store";

const REDIRECT_URI = "http://localhost/"; // A dummy redirect used only for token extraction

const authLogic = {
  getLoginUrl: (): string => {
    const params = new URLSearchParams({
      redirect_uri: REDIRECT_URI,
      client_id: "play-valorant-web-prod",
      response_type: "token id_token",
      nonce: "1",
      scope: "account openid",
    });
    return `https://auth.riotgames.com/authorize?${params.toString()}`;
  },

  parseLoginResponseUrl: async (url: string): Promise<void> => {
    try {
      const fragment = url.split("#")[1];
      if (!fragment) throw new Error("No token fragment in redirect URL");

      const params = new URLSearchParams(fragment);
      const accessToken = params.get("access_token");
      const idToken = params.get("id_token");
      const expiresIn = params.get("expires_in");

      if (!accessToken || !idToken) {
        throw new Error("Missing tokens in redirect URL");
      }

      // Save tokens securely
      await SecureStore.setItem("access_token", accessToken);
      await SecureStore.setItem("id_token", idToken);

      const expiryTimestamp = Date.now() + parseInt(expiresIn || "3600") * 1000;
      await AsyncStorage.setItem("token_expiry", expiryTimestamp.toString());
    } catch (err) {
      console.error("Failed to parse login redirect URL:", err);
      throw err;
    }
  },

  getEntitlement: async (): Promise<void> => {
    const accessToken = await SecureStore.getItem("access_token");
    if (!accessToken) throw new Error("Missing access token");

    const res = await fetch("https://entitlements.auth.riotgames.com/api/token/v1", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: "{}",
    });

    const json = await res.json();
    if (!json.entitlements_token) throw new Error("Entitlement token not found");

    await SecureStore.setItem("entitlements_token", json.entitlements_token);
  },
};

export default authLogic;
