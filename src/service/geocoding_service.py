# imports e configuração inicial do módulo
from fastapi import FastAPI, HTTPException, Query
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
from typing import Optional
import uvicorn
from pydantic import BaseModel
import asyncio
from concurrent.futures import ThreadPoolExecutor
import re
from fastapi.middleware.cors import CORSMiddleware
import os
from supabase import create_client, Client
from dotenv import load_dotenv
import time
import traceback

load_dotenv()
app = FastAPI()
# topo do arquivo (configuração de geolocator e executor)
geolocator = Nominatim(user_agent="dashboard-gestao-leads", timeout=15)
executor = ThreadPoolExecutor(max_workers=1)

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://gmtxmjhrwxuacwsrkbqt.supabase.co")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_KEY = SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY
if not SUPABASE_KEY:
    raise RuntimeError("Faltando SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_ANON_KEY no .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

class EnderecoRequest(BaseModel):
    endereco: Optional[str] = None
    numero: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None
    cep: Optional[str] = None
    bairro: Optional[str] = None

def normalize_address(address: str) -> str:
    address = re.sub(r'[áàãâä]', 'a', address.lower())
    address = re.sub(r'[éèêë]', 'e', address)
    address = re.sub(r'[íìîï]', 'i', address)
    address = re.sub(r'[óòõôö]', 'o', address)
    address = re.sub(r'[úùûü]', 'u', address)
    address = re.sub(r'[ç]', 'c', address)
    address = re.sub(r'\bav\b|\bavn\b|\bavenida\b', 'avenida', address)
    address = re.sub(r'\br\b|\brua\b', 'rua', address)
    address = re.sub(r'[.,;]+', ' ', address)  # remove pontuação comum
    address = re.sub(r'\s+', ' ', address).strip()  # compacta espaços
    return address

def build_candidates(req: EnderecoRequest) -> list[str]:
    cands = []
    if req.endereco:
        base = req.endereco
        if req.numero:
            cands.append(f"{base} {req.numero}, {req.bairro or ''}, {req.cidade}, {req.estado}, Brasil")
        cands.append(f"{base}, {req.bairro or ''}, {req.cidade}, {req.estado}, Brasil")
    if req.cep:
        cands.append(f"{req.cep}, Brasil")
    if req.cidade and req.estado:
        cands.append(f"{req.bairro or ''}, {req.cidade}, {req.estado}, Brasil")
        cands.append(f"{req.cidade}, {req.estado}, Brasil")
    return [normalize_address(c) for c in cands if c.strip()]

def geocode_address(endereco_completo: str) -> Optional[dict]:
    try:
        endereco_normalizado = normalize_address(endereco_completo)
        location = geolocator.geocode(endereco_normalizado, exactly_one=True, timeout=15, country_codes=['br'])
        if location:
            return {"lat": location.latitude, "lng": location.longitude}
        return None
    except GeocoderTimedOut:
        return None

def to_coord_string(lat: float, lng: float) -> str:
    return f"{lat:.6f},{lng:.6f}"

@app.post("/geocode")
async def geocode(request: EnderecoRequest):
    enderecos_para_tentar = build_candidates(request)
    for endereco in enderecos_para_tentar:
        try:
            result = await asyncio.get_event_loop().run_in_executor(executor, safe_geocode_address, endereco)
            if result:
                return result
            await asyncio.sleep(1)  # respeita 1 req/s
        except Exception as e:
            print(f"Erro ao geocodificar {endereco}: {str(e)}")
            continue
    raise HTTPException(status_code=404, detail="Localização não encontrada")

@app.get("/health")
def health():
    return {"status": "ok"}

# imports (acrescentei asyncio e traceback)
import asyncio
import traceback

# Configuração do job automático
AUTO_BATCH_ENABLED = True
AUTO_BATCH_INTERVAL_SECONDS = 300  # 5 minutos
AUTO_BATCH_CHUNK_SIZE = 120        # processa em blocos

# Helper para montar o endereço
# Funções auxiliares e geocoder seguro
# topo do arquivo
from concurrent.futures import ThreadPoolExecutor
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderServiceError, GeocoderTimedOut
import asyncio

geocoder = Nominatim(user_agent="agoha-dashboard", timeout=15)
geocode_executor = ThreadPoolExecutor(max_workers=1)

def normalize_str(v: str) -> str:
    return str(v or "").strip().lower()

def find_existing_coords(row: dict):
    endereco = normalize_str(row.get("endereco"))
    numero = normalize_str(row.get("numero"))
    bairro = normalize_str(row.get("bairro"))
    cidade = normalize_str(row.get("cidade"))
    estado = normalize_str(row.get("estado"))
    cep = normalize_str(row.get("cep"))
    q = supabase.table("leads").select("id,coordenadas_precisas") \
        .eq("endereco", endereco).eq("numero", numero) \
        .eq("bairro", bairro).eq("cidade", cidade) \
        .eq("estado", estado).eq("cep", cep) \
        .not_.is_("coordenadas_precisas", None).limit(1)
    resp = q.execute()
    rows = resp.data or []
    if rows:
        return rows[0].get("coordenadas_precisas")
    return None

# função: safe_geocode_address
async def safe_geocode_address(address: str, attempts: int = 3):
    addr = (address or "").strip()
    if not addr:
        return None

    loop = asyncio.get_running_loop()
    for attempt in range(attempts):
        try:
            result = await loop.run_in_executor(
                geocode_executor, lambda: geocoder.geocode(addr, exactly_one=True)
            )
            await asyncio.sleep(1)
            if result:
                return (result.latitude, result.longitude)
            return None
        except (GeocoderTimedOut, GeocoderServiceError, Exception):
            await asyncio.sleep(1 * (2 ** attempt))
    return None

def build_candidate_address(row: dict) -> str:
    parts = []
    endereco = str(row.get("endereco", "")).strip()
    numero = str(row.get("numero", "")).strip()
    if endereco:
        parts.append(endereco + (f" {numero}" if numero else ""))
    bairro = str(row.get("bairro", "")).strip()
    cidade = str(row.get("cidade", "")).strip()
    estado = str(row.get("estado", "")).strip()
    cep = str(row.get("cep", "")).strip()
    if bairro: parts.append(bairro)
    if cidade: parts.append(cidade)
    if estado: parts.append(estado)
    if cep: parts.append(cep)
    return ", ".join([p for p in parts if p])

# Worker: primeiro tenta reaproveitar, depois geocodifica rápido e com fallback
async def run_auto_batch_once():
    try:
        offset = 0
        updated_total = 0
        while True:
            query = supabase.table("leads").select(
                "id,endereco,numero,bairro,cidade,estado,cep,coordenadas_precisas"
            ).order("id", desc=False).range(offset, offset + AUTO_BATCH_CHUNK_SIZE - 1)
            resp = query.execute()
            rows = resp.data or []
            if not rows:
                break

            for row in rows:
                if row.get("coordenadas_precisas"):
                    continue

                reused = find_existing_coords(row)
                if reused:
                    supabase.table("leads").update({
                        "coordenadas_precisas": reused
                    }).eq("id", row["id"]).execute()
                    updated_total += 1
                    continue

                candidate = build_candidate_address(row)
                has_number = bool(str(row.get("numero") or "").strip())
                latlng = await safe_geocode_address(candidate, attempts=(3 if has_number else 1))

                if not latlng:
                    bairro = str(row.get("bairro") or "").strip()
                    cidade = str(row.get("cidade") or "").strip()
                    estado = str(row.get("estado") or "").strip()
                    if bairro and cidade and estado:
                        latlng = await safe_geocode_address(f"{bairro}, {cidade}, {estado}", attempts=2)
                    if not latlng and cidade and estado:
                        latlng = await safe_geocode_address(f"{cidade}, {estado}", attempts=1)

                if latlng:
                    supabase.table("leads").update({
                        "coordenadas_precisas": f"{latlng[0]},{latlng[1]}"
                    }).eq("id", row["id"]).execute()
                    updated_total += 1

            offset += AUTO_BATCH_CHUNK_SIZE
            if len(rows) < AUTO_BATCH_CHUNK_SIZE:
                break

        print(f"[auto-batch] atualizados: {updated_total}")
    except Exception:
        traceback.print_exc()

async def auto_batch_worker():
    if not AUTO_BATCH_ENABLED:
        return
    # roda uma vez ao iniciar
    await run_auto_batch_once()
    # repete a cada 5 minutos
    while True:
        await asyncio.sleep(AUTO_BATCH_INTERVAL_SECONDS)
        await run_auto_batch_once()

# dispara o worker ao subir a aplicação
@app.on_event("startup")
async def on_startup():
    asyncio.create_task(auto_batch_worker())

@app.post("/batch_geocode")
async def batch_geocode(force: bool = Query(default=False), limit: int = 200, offset: int = 0):
    try:
        query = supabase.table("leads").select(
            "id,endereco,numero,bairro,cidade,estado,cep,coordenadas_precisas"
        ).order("id", desc=False).range(offset, offset + limit - 1)
        resp = query.execute()
        rows = resp.data or []

        targets = rows if force else [r for r in rows if not r.get("coordenadas_precisas")]

        updated = 0
        processed = 0
        errors = 0

        for r in targets:
            processed += 1
            req = EnderecoRequest(**r)
            candidates = build_candidates(req)
            result = None

            for cand in candidates:
                key = normalize_address(cand)
                if key in addr_cache:
                    result = addr_cache[key]
                else:
                    result = await asyncio.get_event_loop().run_in_executor(executor, safe_geocode_address, cand)
                    await asyncio.sleep(1)  # respeita 1 req/s
                    if result:
                        addr_cache[key] = result
                if result:
                    break

            if result:
                coord = to_coord_string(result["lat"], result["lng"])
                update_resp = supabase.table("leads").update({"coordenadas_precisas": coord}).eq("id", r["id"]).execute()
                if getattr(update_resp, "error", None):
                    errors += 1
                    print(f"Erro ao atualizar id={r['id']}: {update_resp.error}")
                else:
                    updated += 1
            else:
                errors += 1

        return {"processed": processed, "updated": updated, "errors": errors, "limit": limit, "offset": offset}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Batch error: {str(e)}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=3002)


# nova função com retries e backoff
def safe_geocode_address(endereco_completo: str, retries: int = 3) -> Optional[dict]:
    for attempt in range(retries):
        try:
            result = geocode_address(endereco_completo)
            if result:
                return result
        except (GeocoderTimedOut, GeocoderServiceError) as e:
            print(f"Timeout/ServiceError ao geocodificar: {endereco_completo} (tentativa {attempt+1}): {e}")
        time.sleep(2 * (attempt + 1))
    return None
addr_cache = {}  # cache simples por endereço normalizado
