import axios from "axios";

const baseURL = process.env.REACT_APP_API_BASE_URL || "http://localhost:4000/api";

const httpClient = axios.create({ baseURL });

httpClient.interceptors.request.use((config) => {
  const token = window.localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

httpClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      window.localStorage.removeItem("auth_token");
      window.localStorage.removeItem("auth_user");
    }
    return Promise.reject(error);
  }
);

export default httpClient;
