const BASE_URL = "http://127.0.0.1:3002";
const GEOCODE_URL = `${BASE_URL}/geocode`;
const TIMEOUT_MS = 3000;

export interface Coords {
  lat: number;
  lng: number;
}

let lastCheck = 0;
let cachedStatus = false;

export async function isGeocodingServiceAvailable(): Promise<boolean> {
  const now = Date.now();
  if (now - lastCheck < 10000) return cachedStatus;

  try {
    const health = await fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(1000) });
    cachedStatus = health.ok;
  } catch {
    cachedStatus = false;
  }
  lastCheck = now;
  return cachedStatus;
}

export async function geocodeAddress(
  endereco?: string,
  numero?: string,
  cidade?: string,
  estado?: string,
  cep?: string,
  bairro?: string
): Promise<Coords | null> {
  try {
    const response = await fetch(GEOCODE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endereco, numero, cidade, estado, cep, bairro }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (response.ok) {
      return await response.json();
    }
  } catch {}
  return null;
}
