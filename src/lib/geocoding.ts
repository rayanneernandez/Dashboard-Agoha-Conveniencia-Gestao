// arquivo: geocoding.ts (funções e helpers)

import { toast } from "sonner";
import { ESTADOS_BRASILEIROS } from "@/types/lead";

const TIMEOUT_MS = 3500;
const BASE_URL = 'http://127.0.0.1:3002';
const GEOCODE_URL = `${BASE_URL}/geocode`;
const NOMINATIM_BASE = import.meta.env.PROD
  ? "https://nominatim.openstreetmap.org"
  : "/nominatim";

let lastCheck = 0;
let cachedStatus = false;

export async function isGeocodingServiceAvailable(): Promise<boolean> {
  // Em produção (ex.: Vercel), o serviço local não existe
  if (import.meta.env.PROD) return false;

  const now = Date.now();
  if (now - lastCheck < 10_000) return cachedStatus;

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
  endereco: string,
  numero: string,
  cidade: string,
  estado: string,
  cep?: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const response = await fetch(GEOCODE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endereco, numero, cidade, estado, cep }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (response.ok) {
      return await response.json();
    }
  } catch {
    return null;
  }
  return null;
}

// Helpers para ranking dos resultados do Nominatim
type NominatimItem = {
  lat: string;
  lon: string;
  class?: string;
  type?: string;
  importance?: number;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
    road?: string;
    house_number?: string;
    suburb?: string;
    neighbourhood?: string;
  };
  display_name?: string;
};

const centerOfBBox = (bbox?: { north: number; south: number; east: number; west: number }) => {
  if (!bbox) return null;
  return { lat: (bbox.north + bbox.south) / 2, lng: (bbox.east + bbox.west) / 2 };
};

const haversineKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const r = 6371;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(h));
};

const normalizeCity = (v?: string) => (v || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const normalizeStreet = (v?: string) => (v || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

const scoreCandidate = (
  item: NominatimItem,
  opts: {
    cityFull?: string;
    hasNumber?: boolean;
    preferHighway?: boolean;
    bboxCenter?: { lat: number; lng: number } | null;
    streetBase?: string;
    numeroStr?: string;
  }
) => {
  const lat = Number(item.lat);
  const lng = Number(item.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return -Infinity;

  const cls = (item.class || "").toLowerCase();
  const type = (item.type || "").toLowerCase();
  const addr = item.address || {};
  const itemCity = normalizeCity(addr.city || addr.town || addr.village);
  const queryCity = normalizeCity(opts.cityFull);

  let score = 0;

  // 1) Consistência com cidade
  if (queryCity && itemCity) {
    score += itemCity === queryCity ? 15 : -10;
  }

  // 2) Correspondência de rua (forte prioridade)
  const baseStreet = normalizeStreet(opts.streetBase);
  const itemStreet = normalizeStreet(addr.road);
  if (baseStreet && itemStreet) {
    if (itemStreet === baseStreet) score += 25;
    else if (itemStreet.includes(baseStreet) || baseStreet.includes(itemStreet)) score += 15;
  }

  // 3) Preferir casa/edificação quando há número e número bate
  if (opts.hasNumber) {
    if (cls === "building" || ["house", "residential"].includes(type)) score += 15;
    if (addr.house_number) {
      score += 8;
      const numQ = (opts.numeroStr || "").trim();
      const numItem = (addr.house_number || "").trim();
      if (numQ && numItem && numQ === numItem) score += 20;
    }
  }

  // 4) Preferir rodovias quando solicitado
  if (opts.preferHighway) {
    if (cls === "highway") score += 12;
    if (["motorway", "trunk", "primary"].includes(type)) score += 8;
  }

  // 5) Importância do Nominatim
  if (typeof item.importance === "number") score += item.importance * 4;

  // 6) Proximidade ao centro do município
  if (opts.bboxCenter) {
    const dist = haversineKm(opts.bboxCenter, { lat, lng });
    score += Math.max(0, 8 - dist);
  }

  return score;
};

const chooseBest = (
  data: any,
  opts: {
    cityFull?: string;
    hasNumber?: boolean;
    preferHighway?: boolean;
    bboxCenter?: { lat: number; lng: number } | null;
    streetBase?: string;
    numeroStr?: string;
  }
): { lat: number; lng: number } | null => {
  if (!Array.isArray(data) || data.length === 0) return null;
  let best: { item: NominatimItem; score: number } | null = null;
  for (const raw of data as NominatimItem[]) {
    const s = scoreCandidate(raw, opts);
    if (!best || s > best.score) best = { item: raw, score: s };
  }
  if (!best) return null;
  const lat = Number(best.item.lat);
  const lng = Number(best.item.lon);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
};

// Busca livre no Nominatim
export async function geocodeWithNominatim(
  endereco?: string,
  numero?: string,
  cidade?: string,
  estado?: string,
  cep?: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const query = cep
      ? `${cep}, Brasil`
      : [endereco, numero, cidade, estado, 'Brasil'].filter(Boolean).join(', ');

    const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&format=json&limit=3&addressdetails=1&countrycodes=br`;
    const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!response.ok) return null;

    const data = await response.json();
    const stateFull = estadoNome(estado) ?? estado;
    const bbox = await getCityBoundingBox(normalizaCidade(cidade), stateFull);
    const center = centerOfBBox(bbox || undefined);

    const streetBase = normalizaVia(endereco) || endereco;

    return chooseBest(data, {
      cityFull: normalizaCidade(cidade),
      hasNumber: !!numero,
      preferHighway: !!endereco && /rodovia|estrada|br-|rj-|presidente dutra|washington luiz/i.test(endereco),
      bboxCenter: center,
      streetBase,
      numeroStr: numero,
    });
  } catch {
    return null;
  }
}

// Helpers de normalização
const estadoNome = (uf?: string): string | undefined => {
  if (!uf) return undefined;
  const found =
    ESTADOS_BRASILEIROS.find((e) => e.sigla.toLowerCase() === uf.toLowerCase()) ||
    ESTADOS_BRASILEIROS.find((e) => e.nome.toLowerCase() === uf.toLowerCase());
  return found?.nome;
};

const normalizaVia = (street?: string): string | undefined => {
  if (!street) return undefined;
  return street
    .replace(/\bRod\b\.?/gi, "Rodovia")
    .replace(/\bAv\b\.?/gi, "Avenida")
    .replace(/\bR\b\.?/gi, "Rua");
};

const removeAcentos = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const CITY_ALIASES: Record<string, string> = {
  "angra": "Angra dos Reis",
  "rio": "Rio de Janeiro",
  "niteroi": "Niterói",
  "nova iguacu": "Nova Iguaçu",
  "sao goncalo": "São Gonçalo",
};

const normalizaCidade = (cidade?: string): string | undefined => {
  if (!cidade) return undefined;
  const key = removeAcentos(cidade).toLowerCase().trim();
  return CITY_ALIASES[key] ?? cidade;
};

// Aliases para vias comuns
const ROAD_ALIASES: Array<{ pattern: RegExp; candidates: string[] }> = [
  {
    pattern: /governador\s+m[áa]rio\s+covas/i,
    candidates: ["BR-101", "Rodovia BR-101", "Rodovia Governador Mario Covas"],
  },
  {
    pattern: /ab[ií]lio\s+augusto\s+t[áa]vora/i,
    candidates: ["RJ-105", "Rodovia RJ-105", "Avenida Abílio Augusto Távora"],
  },
];

// Monta candidatos de rua
function buildStreetCandidates(endereco?: string, numero?: string): string[] {
  const base = normalizaVia(endereco) || endereco || "";
  const num = numero?.trim();
  const candidates = new Set<string>();

  if (base && num) candidates.add(`${base} ${num}`);
  if (base) candidates.add(base);

  for (const { pattern, candidates: cands } of ROAD_ALIASES) {
    if (base && pattern.test(base)) {
      for (const alt of cands) {
        candidates.add(num ? `${alt} ${num}` : alt);
      }
    }
  }

  const noAccent = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  [...candidates].forEach((c) => candidates.add(noAccent(c)));

  return [...candidates];
}

// Bounding box por cidade
const bboxCache = new Map<string, { west: number; south: number; east: number; north: number }>();

async function getCityBoundingBox(city?: string, state?: string) {
  const c = normalizaCidade(city);
  const s = estadoNome(state) ?? state;
  if (!c || !s) return null;
  const cacheKey = `${c}|${s}`;
  if (bboxCache.has(cacheKey)) return bboxCache.get(cacheKey)!;

  const params = [
    `city=${encodeURIComponent(c)}`,
    `state=${encodeURIComponent(s!)}`,
    "country=Brasil",
    "format=json",
    "limit=1",
    "addressdetails=0",
    "countrycodes=br",
  ].join("&");

  const resp = await fetch(`${NOMINATIM_BASE}/search?${params}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!resp.ok) return null;
  const data = await resp.json();
  if (Array.isArray(data) && data.length > 0 && data[0].boundingbox) {
    const [south, north, west, east] = data[0].boundingbox.map((v: string) => Number(v));
    const bbox = { west, south, east, north };
    bboxCache.set(cacheKey, bbox);
    return bbox;
  }
  return null;
}

// Busca estruturada no Nominatim com candidates e bounding
export async function geocodeWithNominatimStructured(
  endereco?: string,
  numero?: string,
  cidade?: string,
  estado?: string,
  cep?: string,
  bairro?: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const stateFull = estadoNome(estado) ?? estado;
    const cityFull = normalizaCidade(cidade);
    const bbox = await getCityBoundingBox(cityFull, stateFull);
    const center = centerOfBBox(bbox || undefined);

    const streetCandidates = buildStreetCandidates(endereco, numero);
    const streetBase = normalizaVia(endereco) || endereco;

    for (const street of streetCandidates) {
      const params = [
        street ? `street=${encodeURIComponent(street)}` : "",
        cityFull ? `city=${encodeURIComponent(cityFull!)}` : "",
        stateFull ? `state=${encodeURIComponent(stateFull!)}` : "",
        bairro ? `district=${encodeURIComponent(bairro!)}` : "",
        cep ? `postalcode=${encodeURIComponent(cep!)}` : "",
        "country=Brasil",
        "format=json",
        "limit=3",
        "addressdetails=1",
        "countrycodes=br",
      ].filter(Boolean);

      if (bbox) {
        params.push(`viewbox=${bbox.west},${bbox.north},${bbox.east},${bbox.south}`);
        params.push("bounded=1");
      }

      const url = `${NOMINATIM_BASE}/search?${params.join("&")}`;
      const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (!response.ok) continue;

      const data = await response.json();
      const best = chooseBest(data, {
        cityFull: cityFull,
        hasNumber: !!numero,
        preferHighway: !!endereco && /rodovia|estrada|br-|rj-|presidente dutra|washington luiz/i.test(endereco),
        bboxCenter: center,
        streetBase,
        numeroStr: numero,
      });
      if (best) return best;
    }
    return null;
  } catch {
    return null;
  }
}