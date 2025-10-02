import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Lead } from "@/types/lead";
import { toast } from "sonner";
import SideMenu from "@/components/dashboard/SideMenu";
import { Loader2 } from "lucide-react";

const MapPage = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const normalizeVisitafeita = (v: boolean | "Sim" | "Não"): "Sim" | "Não" =>
    v === true || v === "Sim" ? "Sim" : "Não";

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("leads").select("*");
      if (error) return toast.error(`Erro ao carregar leads: ${error.message}`);
      if (data) {
        setLeads(
          data.map((l) => ({
            ...l,
            visitafeita: normalizeVisitafeita(l.visitafeita),
          }))
        );
      }
    } catch {
      toast.error("Erro inesperado ao carregar leads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Aqui você pode adicionar a integração com uma biblioteca de mapas como Google Maps ou Leaflet
  // Este é um exemplo simples com um placeholder para o mapa

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
              <h1 className="text-2xl font-bold leading-tight">Mapa de Leads</h1>
              <p className="text-white/80 text-sm">Visualização geográfica</p>
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
          <div className="bg-white rounded-lg shadow-md p-4 h-[70vh] flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-[#660629] mb-4">Mapa de Leads</h2>
              <p className="text-gray-500">
                Aqui será exibido o mapa com a localização dos leads.
                <br />
                Total de leads: {leads.length}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapPage;