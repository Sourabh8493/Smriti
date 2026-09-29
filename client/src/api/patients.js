import request from "./client.js";

export function getMyPatient() {
  return request("/patients/me");
}

/** Full upsert — always send the complete current state of every section. */
export function savePatient(patientData) {
  return request("/patients/me", { method: "PUT", body: patientData });
}

export function analyzeMemoryCopilot(memoryData) {
  return request("/patients/memory-copilot", { method: "POST", body: memoryData });
}
