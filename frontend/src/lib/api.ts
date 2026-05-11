import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

const isBrowser = () => typeof window !== "undefined";
const getAccessToken = () => (isBrowser() ? localStorage.getItem("assetflow_access_token") : null);
const setAccessToken = (token: string) => {
  if (isBrowser()) localStorage.setItem("assetflow_access_token", token);
};
const clearAccessToken = () => {
  if (isBrowser()) localStorage.removeItem("assetflow_access_token");
};

function isAuthEndpoint(url?: string) {
  return Boolean(url && (url.includes("/auth/login") || url.includes("/auth/refresh-token") || url.includes("/auth/logout")));
}

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;

    // Important: never refresh while handling auth endpoints. Otherwise a missing/expired
    // refresh cookie can create a request loop and trigger 429 Too Many Requests.
    if (!original || status !== 401 || original._retry || isAuthEndpoint(original.url)) {
      return Promise.reject(error);
    }

    // If there is no access token yet, this is simply an unauthenticated request.
    // Send the user to login instead of calling refresh-token repeatedly.
    if (!getAccessToken()) {
      clearAccessToken();
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      const refresh = await refreshClient.post("/auth/refresh-token");
      const accessToken = refresh.data?.data?.accessToken;
      if (!accessToken) throw new Error("Refresh endpoint did not return an access token");

      setAccessToken(accessToken);
      original.headers.Authorization = `Bearer ${accessToken}`;
      return api(original);
    } catch (refreshError) {
      clearAccessToken();
      if (isBrowser() && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      return Promise.reject(refreshError);
    }
  }
);
