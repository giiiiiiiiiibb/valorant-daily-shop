import axios, { AxiosResponse } from "axios";
// utils
import secureStore from "@/utils/secure-store";

const authLogic = {
    getEntitlement: async (): Promise<void> => {
        const accessToken = await secureStore.getItem("access_token");

        if (!accessToken) {
            throw new Error("Access token not found");
        }

        const options = {
            method: "POST",
            url: "https://entitlements.auth.riotgames.com/api/token/v1",
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                Authorization: "Bearer " + accessToken,
            },
            data: {},
        };

        const response = await axios.request(options);

        if (
            response.headers["content-type"]?.includes("application/json") &&
            typeof response.data === "object" &&
            response.data.entitlements_token
        ) {
            await secureStore.setItem("entitlements_token", response.data.entitlements_token);
        } else {
            throw new Error(`Unexpected response format: ${JSON.stringify(response.data)}`);
        }
    },
};

export default authLogic;
