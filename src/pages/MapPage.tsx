import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { geocodeAddress, isGeocodingServiceAvailable } from "@/lib/geocoding";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AIChat from "@/components/dashboard/AIChat";
import { Lead } from "@/types/lead";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const TIMEOUT_MS = 3000;

function MapPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [markers, setMarkers] = useState<
    Array<{ lat: number; lng: number; lead: Lead }>
  >([]);
  const [leadsVisiveis, setLeadsVisiveis] = useState(0);
  const [coordenadasCache, setCoordendasCache] = useState<
    Record<string, { lat: number; lng: number }>
  >({});

  const sanitize = (v: any) =>
    (v ?? "").toString().trim().toUpperCase() === "EMPTY"
      ? ""
      : (v ?? "").toString().trim();

  const parseCoords = (raw: any) => {
    if (!raw) return null;
    try {
      if (typeof raw === "string") {
        const parts = raw.split(",").map(Number);
        if (parts.length === 2) return { lat: parts[0], lng: parts[1] };
      }
    } catch {}
    return null;
  };

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("dataultimaatualizacao", { ascending: false });
      if (error) throw error;

      const normalized = (data || []).map((lead: any) => ({
        ...lead,
        endereco: sanitize(lead.endereco),
        numero: sanitize(lead.numero),
        bairro: sanitize(lead.bairro),
        cidade: sanitize(lead.cidade),
        estado: sanitize(lead.estado),
        cep: sanitize(lead.cep),
        coordenadas: parseCoords(lead.coordenadas_precisas) || null,
      }));

      setLeads(normalized);

      const markersAtualizados = normalized
        .filter((l) => l.coordenadas)
        .map((l) => ({ lat: l.coordenadas.lat, lng: l.coordenadas.lng, lead: l }));

      setMarkers(markersAtualizados);
      setLeadsVisiveis(markersAtualizados.length);
    } catch (err: any) {
      toast.error(err.message || "Erro ao carregar leads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const up = await isGeocodingServiceAvailable();
        if (up) {
          const resp = await fetch("http://127.0.0.1:3002/batch_geocode?force=false", { method: "POST" });
          if (resp.ok) {
            const json = await resp.json();
            console.log("Batch:", json);
          } else {
            console.warn("Batch falhou:", resp.status);
          }
        }
      } catch {
        console.warn("Serviço de geocodificação offline");
      }
      await fetchLeads();
    };
    init();

    const channel = supabase
      .channel("leads_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, fetchLeads)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getMapCenter = () => {
    if (markers.length === 0) return [-23.5505, -46.6333];
    const lats = markers.map((m) => m.lat);
    const lngs = markers.map((m) => m.lng);
    return [
      (Math.max(...lats) + Math.min(...lats)) / 2,
      (Math.max(...lngs) + Math.min(...lngs)) / 2,
    ];
  };

  // NOVO: valida e serializa coordenadas
  const isValidCoords = (
    coords: { lat: number; lng: number } | null
  ): coords is { lat: number; lng: number } => {
    return !!coords && isFinite(coords.lat) && isFinite(coords.lng);
  };
  const toCoordString = (c: { lat: number; lng: number }) => `${c.lat},${c.lng}`;

  // geocodifica um lead e persiste coordenadas, atualizando marcador sem duplicar
  const geocodeAndPersist = async (lead: Lead) => {
    if ((lead as any).coordenadas_precisas) return;
    try {
      const coords = await geocodeAddress(
        lead.endereco,
        lead.numero,
        lead.cidade,
        lead.estado,
        lead.cep,
        lead.bairro
      );
      if (isValidCoords(coords)) {
        const str = toCoordString(coords);
        await supabase.from("leads").update({ coordenadas_precisas: str }).eq("id", lead.id);
        setMarkers((prev) => {
          const without = prev.filter((m) => m.lead.id !== lead.id);
          return [...without, { lat: coords.lat, lng: coords.lng, lead: { ...lead, coordenadas_precisas: str } as any }];
        });
      }
    } catch {}
  };

  useEffect(() => {
    const init = async () => {
      try {
        const up = await isGeocodingServiceAvailable();
        if (up) {
          const resp = await fetch("http://127.0.0.1:3002/batch_geocode?force=false", { method: "POST" });
          if (resp.ok) {
            const json = await resp.json();
            console.log("Batch:", json);
          } else {
            console.warn("Batch falhou:", resp.status);
          }
        }
      } catch {
        console.warn("Serviço de geocodificação offline");
      }
      await fetchLeads();
    };
    init();

    const channel = supabase
      .channel("leads_changes")
      // INSERT: geocodifica imediatamente o novo lead
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "leads" }, (payload) => {
        const l = payload.new as any;
        const normalized = {
          ...l,
          endereco: sanitize(l.endereco),
          numero: sanitize(l.numero),
          bairro: sanitize(l.bairro),
          cidade: sanitize(l.cidade),
          estado: sanitize(l.estado),
          cep: sanitize(l.cep),
        } as Lead;
        geocodeAndPersist(normalized);
      })
      // UPDATE: reprocessa se mudou endereço ou ainda não há coordenadas
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "leads" }, (payload) => {
        const l = payload.new as any;
        const normalized = {
          ...l,
          endereco: sanitize(l.endereco),
          numero: sanitize(l.numero),
          bairro: sanitize(l.bairro),
          cidade: sanitize(l.cidade),
          estado: sanitize(l.estado),
          cep: sanitize(l.cep),
        } as Lead;
        geocodeAndPersist(normalized);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // NOVO: fallback — ao carregar leads, geocodifica no cliente quem está sem coordenadas
  useEffect(() => {
    const faltando = leads.filter((l: any) => !l.coordenadas_precisas && l.endereco);
    // limita para não travar a UI
    faltando.slice(0, 50).forEach(geocodeAndPersist);
  }, [leads]);

  return (
    <DashboardLayout leads={leads}>
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Mapa de Leads</h2>
          <span className="text-sm text-gray-600">Leads no mapa: {leadsVisiveis}</span>
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
                attribution='&copy; OpenStreetMap'
              />
              {markers.map((m, i) => (
                <Marker key={`${m.lead.id}-${i}`} position={[m.lat, m.lng]}>
                  <Popup>
                    <h3 className="font-bold text-[#660629]">{m.lead.nome}</h3>
                    <p className="text-sm">{m.lead.endereco}, {m.lead.cidade}</p>
                    <p className="text-xs">{m.lead.estado} - {m.lead.cep}</p>
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
}

export default MapPage;
