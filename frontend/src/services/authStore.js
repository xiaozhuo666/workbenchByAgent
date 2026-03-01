import { login, logout, me, register } from "../api/authApi";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export function getToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

function setSession(token, user) {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export async function doRegister(payload) {
  const res = await register(payload);
  const { token, user } = res.data;
  setSession(token, user);
  return user;
}

export async function doLogin(payload) {
  const res = await login(payload);
  const { token, user } = res.data;
  setSession(token, user);
  return user;
}

export async function restoreSession() {
  if (!getToken()) return null;
  const res = await me();
  const user = res.data;
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}

export async function doLogout() {
  try {
    await logout();
  } finally {
    clearSession();
  }
}
