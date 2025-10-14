import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { geocodeAddress, isGeocodingServiceAvailable } from "@/lib/geocoding";
import { toast } from "sonner";

type LeadRow = {
  id: number;
  nome?: string;
  endereco?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  coordenadas_precisas?: string | null;
};

export default function DebugGeocodePage() {
  const [rows, setRows] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("leads")
      .select("id,nome,endereco,numero,bairro,cidade,estado,cep,coordenadas_precisas")
      .order("id", { ascending: true });
    if (error) toast.error(error.message);
    setRows(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const geocodeOne = async (l: LeadRow) => {
    try {
      const coords = await geocodeAddress(l.endereco, l.numero, l.cidade, l.estado, l.cep, l.bairro);
      if (coords) {
        const coordStr = `${coords.lat},${coords.lng}`;
        const { error } = await supabase.from("leads").update({ coordenadas_precisas: coordStr }).eq("id", l.id);
        if (error) return toast.error(error.message);
        toast.success(`Lead ${l.id} atualizado`);
        await load();
      } else {
        toast.error(`Não encontrado: ${l.endereco} ${l.numero} ${l.bairro} ${l.cidade}-${l.estado}`);
      }
    } catch (e: any) {
      toast.error(e.message || "Erro ao geocodificar");
    }
  };

  const forceBatch = async () => {
    try {
      const up = await isGeocodingServiceAvailable();
      if (!up) return toast.error("Serviço de geocodificação offline");
      const resp = await fetch("http://127.0.0.1:3002/batch_geocode?force=false&limit=80", { method: "POST" });
      if (!resp.ok) return toast.error(`Batch falhou: ${resp.status}`);
      const json = await resp.json();
      toast.success(`Batch: processed=${json.processed} updated=${json.updated} errors=${json.errors}`);
      await load();
    } catch {
      toast.error("Falha ao acionar batch");
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Debug Geocode (oculto)</h1>
        <button className="px-3 py-2 bg-[#8E0D3C] text-white rounded" onClick={forceBatch}>Forçar Batch</button>
      </div>
      {loading ? (
        <div>Carregando...</div>
      ) : (
        <div className="overflow-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">ID</th>
                <th className="p-2 text-left">Nome</th>
                <th className="p-2 text-left">Endereço</th>
                <th className="p-2 text-left">Cidade/UF</th>
                <th className="p-2 text-left">CEP</th>
                <th className="p-2 text-left">Coord. Precis.</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.id} className="border-t">
                  <td className="p-2">{l.id}</td>
                  <td className="p-2">{l.nome}</td>
                  <td className="p-2">{`${l.endereco || ""} ${l.numero || ""} ${l.bairro || ""}`}</td>
                  <td className="p-2">{`${l.cidade || ""}/${l.estado || ""}`}</td>
                  <td className="p-2">{l.cep}</td>
                  <td className="p-2">{l.coordenadas_precisas || "-"}</td>
                  <td className="p-2">
                    <button className="px-2 py-1 bg-[#FF6900] text-white rounded" onClick={() => geocodeOne(l)}>
                      Geocodificar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}