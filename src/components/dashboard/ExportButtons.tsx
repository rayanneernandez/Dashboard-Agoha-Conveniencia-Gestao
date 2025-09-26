import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText, ChevronDown } from "lucide-react";
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
  dashboardRef: React.RefObject<HTMLDivElement>; // Apenas os cards do dashboard
  excludeFields?: string[];
}

const ExportButtons = ({ leads, stats, dashboardRef, excludeFields = [] }: ExportButtonsProps) => {

  // Exportar Leads para Excel
  const exportToExcel = () => {
    try {
      const data = leads.map(lead => {
        const copy = { ...lead };
        excludeFields.forEach(field => delete (copy as any)[field]);
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
          "Data da Última Visita": copy.dataVisita || "",
          Status: copy.status,
          Temperatura: copy.temperatura,
          "Detalhes Status": copy.detalhesStatus
        };
      });

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Leads");

      // Cabeçalho colorido
      const range = XLSX.utils.decode_range(ws['!ref'] || '');
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell = ws[XLSX.utils.encode_cell({ r: 0, c: C })];
        if (cell) {
          cell.s = {
            fill: { fgColor: { rgb: "660629" } },
            font: { color: { rgb: "FFFFFF" }, bold: true },
            alignment: { horizontal: "center" }
          };
        }
      }

      XLSX.writeFile(wb, "leads.xlsx");
    } catch (error) {
      console.error("Erro ao exportar Excel:", error);
    }
  };

  // Exportar lista de Leads para PDF
  const exportLeadsToPDF = () => {
    try {
      const doc = new jsPDF("l", "mm", "a4");
      const tableData = leads.map(lead => [
        lead.nome,
        lead.razaosocial,
        lead.email,
        lead.telefone,
        lead.endereco,
        lead.numero,
        lead.bairro,
        lead.cidade,
        lead.estado,
        lead.dataVisita || "",
        lead.status,
        lead.temperatura,
        lead.detalhesStatus || "-"
      ]);

      const head = [[
        "Nome", "Razão Social", "Email", "Telefone", "Endereço", "Número", "Bairro", "Cidade", "Estado", "Data da Última Visita", "Status", "Temperatura", "Detalhes Status"
      ]];

      autoTable(doc, {
        head,
        body: tableData,
        styles: { fontSize: 8, cellPadding: 1, overflow: 'linebreak', font: 'helvetica', halign: 'center', valign: 'middle' },
        headStyles: { fillColor: [102, 6, 41], textColor: 255, fontSize: 9, fontStyle: 'bold', halign: 'center' },
        margin: { top: 20, left: 10, right: 10 },
        theme: 'grid',
        didDrawPage: () => {
          doc.setFontSize(15);
          doc.text("Lista de Leads", doc.internal.pageSize.getWidth() / 2, 12, { align: "center" });
        }
      });

      doc.save("lista-leads.pdf");
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
    }
  };

  // Exportar Dashboard para PDF (apenas cards e gráficos)
  const exportDashboardToPDF = async () => {
    if (!dashboardRef.current) return;
    try {
      const element = dashboardRef.current;
      
      // Configurações para melhor qualidade
      const canvas = await html2canvas(element, {
        scale: 2, // Aumenta a qualidade
        useCORS: true,
        logging: false,
        backgroundColor: '#F8F9FA',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Criar PDF em paisagem para melhor ajuste
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Calcular dimensões mantendo proporção
      const ratio = canvas.width / canvas.height;
      let imgWidth = pageWidth - 20; // margem de 10mm em cada lado
      let imgHeight = imgWidth / ratio;
      
      // Se a altura for maior que a página, ajustar
      if (imgHeight > pageHeight - 20) {
        imgHeight = pageHeight - 20;
        imgWidth = imgHeight * ratio;
      }
      
      // Centralizar na página
      const x = (pageWidth - imgWidth) / 2;
      const y = (pageHeight - imgHeight) / 2;
      
      // Adicionar título
      pdf.setFontSize(16);
      pdf.setTextColor(102, 6, 41); // Cor do título (#660629)
      pdf.text('Dashboard de Leads', pageWidth / 2, 15, { align: 'center' });
      
      // Adicionar imagem
      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
      
      pdf.save('dashboard.pdf');
    } catch (error) {
      console.error('Erro ao exportar dashboard:', error);
      
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="bg-white text-[#660629] border border-[#660629] shadow-card hover:bg-[#fce4ec] hover:scale-105 transition-all duration-300 flex items-center gap-2">
          <Download className="h-4 w-4" />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={exportToExcel} className="flex items-center gap-2 text-[#660629] hover:text-[#660629]">
          <FileSpreadsheet className="h-4 w-4" />
          Exportar para Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportLeadsToPDF} className="flex items-center gap-2 text-[#660629] hover:text-[#660629]">
          <FileText className="h-4 w-4" />
          Exportar Lista em PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportDashboardToPDF} className="flex items-center gap-2 text-[#660629] hover:text-[#660629]">
          <Download className="h-4 w-4" />
          Exportar Dashboard em PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportButtons;
