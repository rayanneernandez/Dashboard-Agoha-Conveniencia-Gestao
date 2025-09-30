import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import { Lead, DashboardStats } from "@/types/lead";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ExportButtonsProps {
  leads: Lead[];
  stats: DashboardStats;
  dashboardRef: React.RefObject<HTMLDivElement>;
  excludeFields?: string[];
}

const ExportButtons = ({
  leads,
  stats,
  dashboardRef,
  excludeFields = [],
}: ExportButtonsProps) => {
  const [loading, setLoading] = useState(false);

  // Exportar Leads para Excel
  const exportToExcel = () => {
    try {
      const data = leads.map((lead) => {
        const copy = { ...lead };
        excludeFields.forEach((field) => delete (copy as any)[field]);
        return {
          Nome: copy.nome,
          "Razão Social": copy.razaosocial,
          Email: copy.email,
          Telefone: copy.telefone,
          Endereço: copy.endereco,
          Numero: copy.numero,
          Bairro: copy.bairro,
          Cidade: copy.cidade,
          Estado: copy.estado,
          "Visita feita": copy.visitafeita ? "Sim" : "Não",
          Status: copy.status,
          Temperatura: copy.temperatura,
          "Detalhes Status": copy.detalhesStatus,
        };
      });

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Leads");

      XLSX.writeFile(wb, "leads.xlsx");
    } catch (error) {
      console.error("Erro ao exportar Excel:", error);
    }
  };

  // Exportar Leads para PDF (tabela)
  const exportLeadsToPDF = () => {
    try {
      const doc = new jsPDF("l", "mm", "a4");
      const tableData = leads.map((lead) => [
        lead.nome,
        lead.razaosocial,
        lead.email,
        lead.telefone,
        lead.endereco,
        lead.numero,
        lead.bairro,
        lead.cidade,
        lead.estado,
        lead.visitafeita ? "Sim" : "Não",
        lead.status,
        lead.temperatura,
        lead.detalhesStatus || "-",
      ]);

      const head = [
        [
          "Nome",
          "Razão Social",
          "Email",
          "Telefone",
          "Endereço",
          "Número",
          "Bairro",
          "Cidade",
          "Estado",
          "Visita Feita",
          "Status",
          "Temperatura",
          "Detalhes",
        ],
      ];

      autoTable(doc, {
        head,
        body: tableData,
        styles: { fontSize: 8, cellPadding: 1, overflow: "linebreak" },
        headStyles: { fillColor: [102, 6, 41], textColor: 255, fontSize: 9 },
        margin: { top: 20 },
        theme: "grid",
        didDrawPage: () => {
          doc.setFontSize(15);
          doc.text(
            "Lista de Leads",
            doc.internal.pageSize.getWidth() / 2,
            12,
            { align: "center" }
          );
        },
      });

      doc.save("lista-leads.pdf");
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
    }
  };

  // Exportar Dashboard para PDF
  const exportDashboardToPDF = async () => {
    if (!dashboardRef.current) return;
    try {
      setLoading(true);
      const element = dashboardRef.current;

      const canvas = await html2canvas(element, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("l", "mm", "a4");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const ratio = canvas.width / canvas.height;
      let imgWidth = pageWidth - 20;
      let imgHeight = imgWidth / ratio;

      if (imgHeight > pageHeight - 30) {
        imgHeight = pageHeight - 30;
        imgWidth = imgHeight * ratio;
      }

      const x = (pageWidth - imgWidth) / 2;
      const y = 25;

      pdf.setFontSize(16);
      pdf.setTextColor(102, 6, 41);
      pdf.text("Dashboard de Leads", pageWidth / 2, 15, { align: "center" });

      pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
      pdf.save("dashboard.pdf");
    } catch (error) {
      console.error("Erro ao exportar dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={loading}
          className="bg-white text-[#660629] border border-[#660629] shadow-card hover:bg-[#fce4ec] hover:scale-105 transition-all duration-300 flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          {loading ? "Gerando..." : "Exportar"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={exportToExcel}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Exportar Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportLeadsToPDF}>
          <FileText className="h-4 w-4 mr-2" />
          Exportar Lista PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportDashboardToPDF}>
          <Download className="h-4 w-4 mr-2" />
          Exportar Dashboard PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportButtons;
