import request from "./client.js";

export function saveGameSession(sessionData) {
  return request("/games/sessions", { method: "POST", body: sessionData });
}

export function listGameSessions(limit = 50) {
  return request(`/games/sessions?limit=${limit}`);
}

export function getDailySummaries() {
  return request("/games/daily-summaries");
}

export function regenerateDailySummary(date) {
  return request("/games/daily-summaries/regenerate", {
    method: "POST",
    body: { date },
  });
}

export function getRecommendedDifficulty() {
  return request("/games/recommended-difficulty");
}

