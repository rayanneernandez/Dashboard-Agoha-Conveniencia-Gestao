from fastapi import FastAPI, HTTPException
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut
from typing import Optional
import uvicorn
from pydantic import BaseModel
import asyncio
from concurrent.futures import ThreadPoolExecutor
import re
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
geolocator = Nominatim(user_agent="dashboard-gestao-leads")
executor = ThreadPoolExecutor(max_workers=5)

class EnderecoRequest(BaseModel):
    endereco: str
    numero: Optional[str]
    cidade: Optional[str]
    estado: Optional[str]
    cep: Optional[str]

def normalize_address(address: str) -> str:
    # Remove acentos e caracteres especiais
    address = re.sub(r'[áàãâä]', 'a', address.lower())
    address = re.sub(r'[éèêë]', 'e', address)
    address = re.sub(r'[íìîï]', 'i', address)
    address = re.sub(r'[óòõôö]', 'o', address)
    address = re.sub(r'[úùûü]', 'u', address)
    address = re.sub(r'[ç]', 'c', address)
    
    # Padroniza abreviações comuns
    address = re.sub(r'\bav\b|\bavn\b|\bavenida\b', 'avenida', address)
    address = re.sub(r'\br\b|\brua\b', 'rua', address)
    
    return address

def geocode_address(endereco_completo: str) -> dict:
    try:
        endereco_normalizado = normalize_address(endereco_completo)
        location = geolocator.geocode(
            endereco_normalizado,
            exactly_one=True,
            timeout=2,
            country_codes=['br']
        )
        if location:
            return {"lat": location.latitude, "lng": location.longitude}
        return None
    except GeocoderTimedOut:
        return None

@app.post("/geocode")
async def geocode(request: EnderecoRequest):
    enderecos_para_tentar = []
    
    # Tenta com endereço completo
    if request.endereco:
        endereco_base = request.endereco
        if request.numero:
            enderecos_para_tentar.append(
                f"{endereco_base} {request.numero}, {request.cidade}, {request.estado}, Brasil"
            )
        enderecos_para_tentar.append(
            f"{endereco_base}, {request.cidade}, {request.estado}, Brasil"
        )
    
    # Tenta com CEP
    if request.cep:
        enderecos_para_tentar.append(f"{request.cep}, Brasil")
    
    # Tenta com cidade e estado
    if request.cidade and request.estado:
        enderecos_para_tentar.append(f"{request.cidade}, {request.estado}, Brasil")

    for endereco in enderecos_para_tentar:
        try:
            result = await asyncio.get_event_loop().run_in_executor(
                executor, 
                geocode_address, 
                endereco
            )
            if result:
                return result
        except Exception as e:
            print(f"Erro ao geocodificar {endereco}: {str(e)}")
            continue

    raise HTTPException(status_code=404, detail="Localização não encontrada")

@app.get("/health")
def health():
    return {"status": "ok"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:5173", "http://127.0.0.1:8080"],
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=3002)