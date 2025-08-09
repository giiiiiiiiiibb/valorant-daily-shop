import axios from "axios";
import { clearSecureStore } from "./secure-store";

/**
 * Axios instance with a conservative 401 handler.
 * Avoid logging raw error objects to prevent leaking sensitive data.
 */
const axiosInstance = axios.create();

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    try {
      if (error?.response?.status === 401) {
        await clearSecureStore();
      }
    } catch {
      // ignore
    }
    // Return a generic error to the app layer
    return Promise.reject("Request failed");
  }
);

export default axiosInstance;
