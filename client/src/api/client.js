/*
  Thin fetch wrapper shared by every api/*.js module: attaches the stored JWT,
  serializes JSON bodies (unless it's a FormData upload), and turns a non-2xx
  response into a thrown Error carrying the server's message so callers can
  just try/catch and show err.message.
*/

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const TOKEN_KEY = "sih26003_token";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export default async function request(path, { method = "GET", body, isForm = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!isForm && body !== undefined) headers["Content-Type"] = "application/json";

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: isForm ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(
      "Couldn't reach the server. Make sure the backend is running (see server/README.md)."
    );
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // No JSON body (e.g. a 204) — fine.
  }

  if (!res.ok) {
    throw new Error(data?.message || `Request failed (${res.status})`);
  }
  return data;
}
