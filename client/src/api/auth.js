import request from "./client.js";

export function signup(payload) {
  return request("/auth/signup", { method: "POST", body: payload });
}

export function login(payload) {
  return request("/auth/login", { method: "POST", body: payload });
}

export function fetchMe() {
  return request("/auth/me");
}
