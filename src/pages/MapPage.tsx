import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Lead } from "@/types/lead";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { geocodeAddress, isGeocodingServiceAvailable, geocodeWithNominatim, geocodeWithNominatimStructured } from "@/lib/geocoding";
import AIChat from '@/components/dashboard/AIChat';
import DashboardLayout from '@/components/layout/DashboardLayout';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [markers, setMarkers] = useState<Array<{ lat: number; lng: number; lead: Lead }>>([]);
  const [leadsVisiveis, setLeadsVisiveis] = useState(0);
  const [coordenadasCache, setCoordendasCache] = useState<Record<string, { lat: number; lng: number }>>({});

  // Limites aproximados do Brasil para validar/sugerir swap lon/lat
  const BR_BOUNDS = { latMin: -34, latMax: 6, lngMin: -74, lngMax: -34 };

  // Normaliza diferentes formatos de coordenadas salvos no banco
  const parseCoordenadas = (raw: any): { lat: number; lng: number } | null => {
    if (!raw) return null;


    if (typeof raw === 'string' && raw.trim().startsWith('{')) {
      try {
        const obj = JSON.parse(raw);
        const lat = obj.lat ?? obj.latitude;
        const lng = obj.lng ?? obj.longitude;
        if (lat != null && lng != null) {
          const la = typeof lat === 'string' ? parseFloat(lat) : lat;
          const ln = typeof lng === 'string' ? parseFloat(lng) : lng;
          if (Number.isFinite(la) && Number.isFinite(ln)) {
            const inBR = la >= BR_BOUNDS.latMin && la <= BR_BOUNDS.latMax && ln >= BR_BOUNDS.lngMin && ln <= BR_BOUNDS.lngMax;
            if (inBR) return { lat: la, lng: ln };
            const swapped = { lat: ln, lng: la };
            const swappedInBR = swapped.lat >= BR_BOUNDS.latMin && swapped.lat <= BR_BOUNDS.latMax && swapped.lng >= BR_BOUNDS.lngMin && swapped.lng <= BR_BOUNDS.lngMax;
            return swappedInBR ? swapped : { lat: la, lng: ln };
          }
        }
      } catch {}
    }

    // Array string: [lat,lng] ou [lng,lat]
    if (typeof raw === 'string' && raw.trim().startsWith('[')) {
      try {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length >= 2) {
          const a = parseFloat(arr[0]);
          const b = parseFloat(arr[1]);
          if (Number.isFinite(a) && Number.isFinite(b)) {
            let la = a, ln = b;
            const inBR = la >= BR_BOUNDS.latMin && la <= BR_BOUNDS.latMax && ln >= BR_BOUNDS.lngMin && ln <= BR_BOUNDS.lngMax;
            if (!inBR) {
              const swapLa = b, swapLn = a;
              const swappedInBR = swapLa >= BR_BOUNDS.latMin && swapLa <= BR_BOUNDS.latMax && swapLn >= BR_BOUNDS.lngMin && swapLn <= BR_BOUNDS.lngMax;
              if (swappedInBR) { la = swapLa; ln = swapLn; }
            }
            return { lat: la, lng: ln };
          }
        }
      } catch {}
    }

    // WKT: POINT(lon lat)
    if (typeof raw === 'string' && /point\s*\(/i.test(raw)) {
      const m = raw.match(/\(\s*([-\d\.]+)\s+([-\d\.]+)\s*\)/i);
      if (m) {
        const lon = parseFloat(m[1]);
        const lat = parseFloat(m[2]);
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
          const candidate = { lat, lng: lon };
          const inBR = lat >= BR_BOUNDS.latMin && lat <= BR_BOUNDS.latMax && lon >= BR_BOUNDS.lngMin && lon <= BR_BOUNDS.lngMax;
          if (inBR) return candidate;
          const swapped = { lat: lon, lng: lat };
          const swappedInBR = swapped.lat >= BR_BOUNDS.latMin && swapped.lat <= BR_BOUNDS.latMax && swapped.lng >= BR_BOUNDS.lngMin && swapped.lng <= BR_BOUNDS.lngMax;
          return swappedInBR ? swapped : candidate;
        }
      }
      return null;
    }

    if (typeof raw === 'string') {
      // remove parênteses e colchetes antes de dividir
      const clean = raw.replace(/[()\[\]]/g, ' ').trim();
      const parts = clean.split(/[,\;\s]+/).map(s => s.trim()).filter(Boolean);
      if (parts.length >= 2) {
        const a = parseFloat(parts[0]);
        const b = parseFloat(parts[1]);
        if (Number.isFinite(a) && Number.isFinite(b)) {
          let la = a, ln = b;
          const inBR = la >= BR_BOUNDS.latMin && la <= BR_BOUNDS.latMax && ln >= BR_BOUNDS.lngMin && ln <= BR_BOUNDS.lngMax;
          if (!inBR) {
            const swapLa = b, swapLn = a;
            const swappedInBR = swapLa >= BR_BOUNDS.latMin && swapLa <= BR_BOUNDS.latMax && swapLn >= BR_BOUNDS.lngMin && swapLn <= BR_BOUNDS.lngMax;
            if (swappedInBR) { la = swapLa; ln = swapLn; }
          }
          return { lat: la, lng: ln };
        }
      }
      return null;
    }

    let lat: any, lng: any;
    if ('lat' in raw && 'lng' in raw) { lat = raw.lat; lng = raw.lng; }
    else if ('latitude' in raw && 'longitude' in raw) { lat = raw.latitude; lng = raw.longitude; }
    else { return null; }
    const la = typeof lat === 'string' ? parseFloat(lat) : lat;
    const ln = typeof lng === 'string' ? parseFloat(lng) : lng;
    if (Number.isFinite(la) && Number.isFinite(ln)) {
      const inBR = la >= BR_BOUNDS.latMin && la <= BR_BOUNDS.latMax && ln >= BR_BOUNDS.lngMin && ln <= BR_BOUNDS.lngMax;
      if (inBR) return { lat: la, lng: ln };
      const swapped = { lat: ln, lng: la };
      const swappedInBR = swapped.lat >= BR_BOUNDS.latMin && swapped.lat <= BR_BOUNDS.latMax && swapped.lng >= BR_BOUNDS.lngMin && swapped.lng <= BR_BOUNDS.lngMax;
      return swappedInBR ? swapped : { lat: la, lng: ln };
    }
    return null;
  };

  // Sanitiza campos: trata 'EMPTY' como vazio
  const sanitize = (v: any): string => {
    const s = (v ?? '').toString().trim();
    return s.toUpperCase() === 'EMPTY' ? '' : s;
  };

  // Fallback de coordenadas por cidade e por estado (capitais/centros aproximados)
  const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
    "Rio de Janeiro,RJ": { lat: -22.9068, lng: -43.1729 },
    "Campo Grande,MS": { lat: -20.4697, lng: -54.6201 },
    "Teresina,PI": { lat: -5.0892, lng: -42.8016 },
    "Nova Iguaçu,RJ": { lat: -22.755, lng: -43.4603 },
  };
  const STATE_COORDS: Record<string, { lat: number; lng: number }> = {
    AC: { lat: -9.0238, lng: -70.812 }, AL: { lat: -9.6498, lng: -35.7089 },
    AP: { lat: 0.0349, lng: -51.0694 }, AM: { lat: -3.119, lng: -60.0217 },
    BA: { lat: -12.9718, lng: -38.5011 }, CE: { lat: -3.7319, lng: -38.5267 },
    DF: { lat: -15.7939, lng: -47.8828 }, ES: { lat: -20.3155, lng: -40.3128 },
    GO: { lat: -16.6869, lng: -49.2648 }, MA: { lat: -2.5387, lng: -44.2825 },
    MT: { lat: -15.601, lng: -56.0974 }, MS: { lat: -20.4697, lng: -54.6201 },
    MG: { lat: -19.9167, lng: -43.9345 }, PA: { lat: -1.4558, lng: -48.4902 },
    PB: { lat: -7.115, lng: -34.8641 }, PR: { lat: -25.4284, lng: -49.2733 },
    PE: { lat: -8.0476, lng: -34.877 }, PI: { lat: -5.0892, lng: -42.8016 },
    RJ: { lat: -22.9068, lng: -43.1729 }, RN: { lat: -5.793, lng: -35.1984 },
    RS: { lat: -30.0346, lng: -51.2177 }, RO: { lat: -8.7612, lng: -63.9039 },
    RR: { lat: 2.819, lng: -60.671 }, SC: { lat: -27.5945, lng: -48.5477 },
    SP: { lat: -23.5505, lng: -46.6333 }, SE: { lat: -10.9472, lng: -37.0731 },
    TO: { lat: -10.1841, lng: -48.3336 },
  };

  const getFallbackCoords = (lead: Lead): { lat: number; lng: number } | null => {
    const cidade = sanitize(lead.cidade);
    const estado = sanitize(lead.estado);
    if (cidade && estado) {
      const key = `${cidade},${estado}`;
      if (CITY_COORDS[key]) return CITY_COORDS[key];
    }
    if (estado && STATE_COORDS[estado]) return STATE_COORDS[estado];
    return null;
  };

  // helper para persistir coordenadas como texto "lat,lng"
  const toCoordString = (c: { lat: number; lng: number }) =>
    `${Number(c.lat).toFixed(6)},${Number(c.lng).toFixed(6)}`;

  const isValidCoords = (c: { lat: number; lng: number } | null): c is { lat: number; lng: number } => {
    if (!c) return false;
    const { lat, lng } = c;
    return Number.isFinite(lat) && Number.isFinite(lng) &&
      lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  };

  // NOVO: campos normalizados para a query
  const buildQueryFields = (lead: Lead) => {
    const endereco = sanitize(lead.endereco);
    const numero = sanitize(lead.numero);
    const cidade = sanitize(lead.cidade);
    const estado = sanitize(lead.estado);
    const cep = sanitize((lead as any).cep);
    const bairro = sanitize((lead as any).bairro);
    return { endereco, numero, cidade, estado, cep, bairro };
  };

  // arquivo: MapPage.tsx (função processLeadsInBatches)
  
  const processLeadsInBatches = async (leads: Lead[]) => {
      const iniciais: Array<{ lat: number; lng: number; lead: Lead }> = [];
      for (const lead of leads) {
        const parsed = coordenadasCache[lead.id] || parseCoordenadas((lead as any).coordenadas ?? null);
        if (isValidCoords(parsed)) {
          iniciais.push({ lat: parsed.lat, lng: parsed.lng, lead });
        }
      }
  
      // Mostra imediatamente os que já têm coordenadas do banco
      if (iniciais.length > 0) {
        setMarkers(iniciais);
        setLeadsVisiveis(iniciais.length);
      }
  
      let serviceUp = false;
      try { serviceUp = await isGeocodingServiceAvailable(); } catch { serviceUp = false; }
  
      const leadsParaGeocoding = leads.filter(lead => {
        const jaTem = iniciais.some(i => i.lead.id === lead.id);
        if (jaTem) return false;
  
        const endereco = sanitize(lead.endereco);
        const cidade = sanitize(lead.cidade);
        const estado = sanitize(lead.estado);
        const cep = sanitize((lead as any).cep);
  
        const cepValido = !!cep && /^\d{8}$/.test(cep.replace(/\D/g, ""));
        const dadosMinimos = Boolean(cepValido || endereco || (cidade && estado) || estado);
  
        return dadosMinimos;
      });
  
      const geocoded = await Promise.all(
        leadsParaGeocoding.map(async (lead) => {
          const { endereco, numero, cidade, estado, cep, bairro } = buildQueryFields(lead);
          const cepValido = !!cep && /^\d{8}$/.test(cep.replace(/\D/g, ""));
  
          // Precisão primeiro
          let precise = await geocodeWithNominatimStructured(endereco, numero, cidade, estado, cep, bairro);
          if (!precise && serviceUp) precise = await geocodeAddress(endereco!, numero!, cidade!, estado!, cep);
          if (!precise) precise = await geocodeWithNominatim(endereco, numero, cidade, estado, cep);
  
          if (isValidCoords(precise)) {
            setCoordendasCache(prev => ({ ...prev, [lead.id]: precise! }));
            setMarkers(prev => ([...prev, { lat: precise!.lat, lng: precise!.lng, lead }]));
            setLeadsVisiveis(prev => prev + 1);
            await supabase.from('leads').update({ coordenadas: toCoordString(precise!) }).eq('id', lead.id);
            return;
          }
  
          // Fallbacks só para exibir (não persiste)
          let fallback: { lat: number; lng: number } | null = null;
  
          if (!fallback && cidade && estado) {
            fallback = await geocodeWithNominatim(undefined, undefined, cidade, estado);
          }
          if (!fallback && cepValido) {
            fallback = await geocodeWithNominatim(undefined, undefined, undefined, undefined, cep);
          }
          if (!fallback && endereco) {
            fallback = await geocodeWithNominatim(endereco);
          }
          if (!fallback && estado && STATE_COORDS[estado]) {
            fallback = STATE_COORDS[estado];
          }
  
          if (isValidCoords(fallback)) {
            setMarkers(prev => ([...prev, { lat: fallback!.lat, lng: fallback!.lng, lead }]));
            setLeadsVisiveis(prev => prev + 1);
          }
        })
      );
  
      setLoading(false);
  };

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order('dataultimaatualizacao', { ascending: false });

      if (error) {
        toast.error(`Erro ao carregar leads: ${error.message}`);
        setLoading(false);
        return;
      }
      if (!data) { setLoading(false); return; }

      const normalizedLeads = data.map((lead: any) => ({
        ...lead,
        endereco: sanitize(lead.endereco),
        numero: sanitize(lead.numero),
        cidade: sanitize(lead.cidade),
        estado: sanitize(lead.estado),
        cep: sanitize(lead.cep),
        coordenadas: parseCoordenadas(lead.coordenadas)
      }));

      setLeads(normalizedLeads);
      void processLeadsInBatches(normalizedLeads);
      setLoading(false);
    } catch (error) {
      console.error("Erro inesperado:", error);
      toast.error("Erro inesperado ao carregar leads");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();

    const subscription = supabase
      .channel('leads_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        fetchLeads();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const getMapCenter = () => {
    if (markers.length === 0) {
      return [-23.5505, -46.6333]; // São Paulo como padrão
    }
    const lats = markers.map(m => m.lat);
    const lngs = markers.map(m => m.lng);
    return [
      (Math.max(...lats) + Math.min(...lats)) / 2,
      (Math.max(...lngs) + Math.min(...lngs)) / 2
    ];
  };

  return (
    <DashboardLayout leads={leads}>
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Mapa de Leads</h2>
          <span className="text-sm text-gray-600">
            Leads no mapa: {leadsVisiveis}
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-[70vh]">
            <Loader2 className="h-12 w-12 animate-spin text-[#660629]" />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-4 h-[70vh] relative z-0">
            <MapContainer
              center={getMapCenter() as [number, number]}
              zoom={4}
              style={{ height: "100%", width: "100%", borderRadius: "0.5rem" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              {markers.map((marker, index) => (
                <Marker key={`${marker.lead.id}-${index}`} position={[marker.lat, marker.lng]}>
                  <Popup>
                    <div className="p-2">
                      <h3 className="font-bold text-[#660629]">{marker.lead.nome}</h3>
                      <p className="text-sm text-gray-600">{marker.lead.razaosocial}</p>
                      <p className="text-sm">
                        {marker.lead.endereco}, {marker.lead.numero}
                        <br />
                        {marker.lead.cidade} - {marker.lead.estado}
                      </p>
                      <div className="mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          marker.lead.status === "Cliente"
                            ? "bg-green-100 text-green-800"
                            : marker.lead.temperatura === "Quente"
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                        }`}>
                          {marker.lead.status === "Cliente" ? "Cliente" : marker.lead.temperatura || "Lead"}
                        </span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}
      </div>

      <AIChat leads={leads} />
    </DashboardLayout>
  );
};

export default MapPage;