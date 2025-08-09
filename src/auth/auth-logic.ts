import axios from "axios";
// utils
import secureStore from "@/utils/secure-store";

/**
 * Auth helper for Riot entitlements. Keep the response handling strict
 * and never log raw payloads (could contain tokens or PII).
 */
const authLogic = {
  getEntitlement: async (): Promise<void> => {
    const accessToken = await secureStore.getItem("access_token");
    if (!accessToken) {
      throw new Error("Access token not found");
    }

    const response = await axios.request({
      method: "POST",
      url: "https://entitlements.auth.riotgames.com/api/token/v1",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: "Bearer " + accessToken,
      },
      data: {},
    });

    const contentType = response.headers["content-type"] || "";
    if (contentType.includes("application/json") && typeof response.data === "object" && response.data.entitlements_token) {
      await secureStore.setItem("entitlements_token", response.data.entitlements_token);
      return;
    }
    throw new Error("Unexpected entitlement response");
  },
};

export default authLogic;
