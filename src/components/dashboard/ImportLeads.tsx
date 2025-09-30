import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import * as XLSX from "xlsx";
import { Lead, ESTADOS_BRASILEIROS } from "@/types/lead";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

interface ImportLeadsProps {
  onImportLeads: (importedLeads: Lead[]) => void;
}

const ImportLeads = ({ onImportLeads }: ImportLeadsProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

      const importedLeads: Lead[] = jsonData.map((row) => {
        const estadoSigla = row["Estado"] || "SP";
        const estadoObj = ESTADOS_BRASILEIROS.find((e) => e.sigla === estadoSigla);
        const regiao = estadoObj?.regiao || "Sudeste";

        const temperaturaValue = row["Temperatura"];
        const temperatura: Lead["temperatura"] =
          temperaturaValue === "Quente" || temperaturaValue === "Frio"
            ? temperaturaValue
            : null;

        const status: Lead["status"] =
          row["Status"]?.toString().toLowerCase() === "inativo" ? "Inativo" : "Ativo";

        const visitafeita: Lead["visitafeita"] =
          row["Visita feita"]?.toString().toLowerCase() === "sim" ? "Sim" : "Não";

        return {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          nome: row["Nome"] || "",
          razaosocial: row["Razão Social"] || "",
          email: row["Email"] || "",
          telefone: row["Telefone"] || "",
          endereco: row["Endereço"] || "",
          numero: row["Numero"] || "",
          bairro: row["Bairro"] || "",
          cidade: row["Cidade"] || "",
          estado: estadoSigla,
          regiao,
          status,
          temperatura,
          emProjecao: row["Em Projeção"]?.toString().toLowerCase() === "sim",
          detalhesStatus: row["Detalhes Status"] || "",
          visitafeita,
          dataultimaatualizacao: new Date().toISOString(),
        };
      });

      // Atualiza estado do front
      onImportLeads(importedLeads);

      // Salva no Supabase
      try {
        const { error } = await supabase.from("leads").insert(importedLeads);
        if (error) {
          console.error("Erro ao salvar leads:", error.message);
          toast.error("Erro ao salvar leads no banco");
        } else {
          toast.success("Leads importados e salvos com sucesso!");
        }
      } catch (err) {
        console.error(err);
        toast.error("Erro ao salvar leads no banco");
      }
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <>
      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      <Button
        onClick={() => fileInputRef.current?.click()}
        className="bg-white text-[#660629] border border-[#660629] shadow-card hover:bg-[#fce4ec] hover:scale-105 transition-all duration-300 flex items-center gap-2"
      >
        <Upload className="h-4 w-4" />
        Importar
      </Button>
    </>
  );
};

export default ImportLeads;
