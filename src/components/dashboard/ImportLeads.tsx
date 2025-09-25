import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import * as XLSX from "xlsx";
import { Lead } from "@/types/lead";

interface ImportLeadsProps {
  onImportLeads: (importedLeads: Lead[]) => void;
}

const ImportLeads = ({ onImportLeads }: ImportLeadsProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

      const importedLeads: Lead[] = jsonData.map(row => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        nome: row["Nome"] || "",
        empresa: row["Empresa"] || "",
        email: row["Email"] || "",
        telefone: row["Telefone"] || "",
        endereco: row["Endereço"] || "",
        cidade: row["Cidade"] || "",
        estado: row["Estado"] || "",
        regiao: row["Região"] || "",
        status: row["Status"] || "Ativo",
        temperatura: row["Temperatura"] || "Frio",
        emProjecao: row["Em Projeção"] === "Sim",
        detalhesStatus: row["Detalhes Status"] || "",
        dataVisita: row["Data da Visita"] || "",
        dataCriacao: new Date().toISOString().split("T")[0],
        dataUltimaAtualizacao: new Date().toISOString().split("T")[0]
      }));

      onImportLeads(importedLeads);
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
        variant="outline"
        className="flex items-center gap-2 text-blue-600 hover:text-blue-600"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="h-4 w-4" />
        Importar
      </Button>
    </>
  );
};

export default ImportLeads;
