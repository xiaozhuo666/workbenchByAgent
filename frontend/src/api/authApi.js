import httpClient from "./httpClient";

export async function register(payload) {
  const { data } = await httpClient.post("/auth/register", payload);
  return data;
}

export async function login(payload) {
  const { data } = await httpClient.post("/auth/login", payload);
  return data;
}

export async function me() {
  const { data } = await httpClient.get("/auth/me");
  return data;
}

export async function logout() {
  const { data } = await httpClient.post("/auth/logout");
  return data;
}
