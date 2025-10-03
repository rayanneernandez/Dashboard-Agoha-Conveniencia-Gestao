import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Lead } from "@/types/lead";
import { toast } from "sonner";
import SideMenu from "@/components/dashboard/SideMenu";
import { Loader2 } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { geocodeAddress } from "@/lib/geocoding";

// Configuração do ícone padrão
const DefaultIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const MapPage = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [markers, setMarkers] = useState<Array<{ lat: number; lng: number; lead: Lead }>>([]);

  const normalizeVisitafeita = (v: boolean | "Sim" | "Não"): "Sim" | "Não" =>
    v === true || v === "Sim" ? "Sim" : "Não";

  const processLead = async (lead: Lead, index: number) => {
    try {
      console.log(`Processando lead: ${lead.nome}`);
      const coords = await geocodeAddress(
        lead.endereco,
        lead.numero,
        lead.cidade,
        lead.estado,
        index // Passando o índice para criar variação nas coordenadas
      );

      if (coords) {
        // Não salvamos mais no banco, apenas retornamos o lead com as coordenadas
        return { ...lead, coordenadas: coords };
      }
      return lead;
    } catch (error) {
      console.error("Erro ao processar lead:", error);
      return lead;
    }
  };

  const fetchLeads = async () => {
    try {
      setLoading(true);
      console.log("Iniciando busca de leads...");

      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order('nome');

      if (error) {
        console.error("Erro ao buscar leads:", error);
        toast.error(`Erro ao carregar leads: ${error.message}`);
        return;
      }

      if (!data) {
        console.log("Nenhum lead encontrado");
        return;
      }

      console.log(`${data.length} leads encontrados`);

      const processedLeads = [];
      const newMarkers = [];

      // Agrupa leads por estado para melhor distribuição
      const leadsPorEstado: { [estado: string]: Lead[] } = {};
      data.forEach(lead => {
        if (!leadsPorEstado[lead.estado]) {
          leadsPorEstado[lead.estado] = [];
        }
        leadsPorEstado[lead.estado].push(lead);
      });

      // Processa os leads estado por estado
      let globalIndex = 0;
      for (const estado of Object.keys(leadsPorEstado)) {
        for (const lead of leadsPorEstado[estado]) {
          const normalizedLead = {
            ...lead,
            visitafeita: normalizeVisitafeita(lead.visitafeita),
          };
          
          const processedLead = await processLead(normalizedLead, globalIndex);
          processedLeads.push(processedLead);

          if (processedLead.coordenadas) {
            newMarkers.push({
              lat: processedLead.coordenadas.lat,
              lng: processedLead.coordenadas.lng,
              lead: processedLead
            });
          }
          
          globalIndex++;
        }
      }

      setLeads(processedLeads);
      setMarkers(newMarkers);
      console.log(`Processamento finalizado. ${newMarkers.length} marcadores criados.`);

    } catch (error) {
      console.error("Erro inesperado:", error);
      toast.error("Erro inesperado ao carregar leads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Resto do componente permanece o mesmo, apenas garantindo que o mapa seja renderizado mesmo sem marcadores
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <SideMenu leads={leads} />
      
      <div className="bg-gradient-header text-white py-3 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-4 ml-16 md:ml-20">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Logo AgHora"
              className="h-16 md:h-10 w-auto object-contain flex-shrink-0"
            />
            <div className="flex flex-col justify-center">
              <h1 className="text-2xl font-bold leading-tight">Mapa de Leads e Clientes</h1>
              <p className="text-white/80 text-sm">
                Localizações encontradas: {markers.length} de {leads.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {loading ? (
          <div className="flex justify-center items-center h-[70vh]">
            <Loader2 className="h-12 w-12 animate-spin text-[#660629]" />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-4 h-[70vh] relative z-0">
            <MapContainer
              center={[-23.5505, -46.6333]} // São Paulo
              zoom={5}
              style={{ height: "100%", width: "100%", borderRadius: "0.5rem" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              
              {markers.map((marker, index) => (
                <Marker
                  key={`${marker.lead.id}-${index}`}
                  position={[marker.lat, marker.lng]}
                >
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
    </div>
  );
};

export default MapPage;