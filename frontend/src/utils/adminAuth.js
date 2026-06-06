const ADMIN_TOKEN_KEY = "adminToken";

export function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function isAdminAuthenticated() {
  return Boolean(getAdminToken());
}

export function setAdminToken(token) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminSession() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}
