import request from "./client.js";

/** Uploads one file, returns the server-relative URL to store (e.g. on a patient record). */
export async function uploadFile(file) {
  const form = new FormData();
  form.append("file", file);
  const data = await request("/uploads", { method: "POST", body: form, isForm: true });
  return data.url;
}

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(
  /\/api\/?$/,
  ""
);

/**
 * Server-relative URLs (/uploads/xyz.jpg) need the API origin prefixed to be
 * loadable from the client's own origin. Blob URLs (local previews) and
 * absolute URLs pass through unchanged.
 */
export function resolveFileUrl(url) {
  if (!url) return url;
  if (/^(https?:|blob:)/.test(url)) return url;
  return `${API_ORIGIN}${url}`;
}
