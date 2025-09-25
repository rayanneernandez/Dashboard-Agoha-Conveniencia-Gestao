import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText, ChevronDown, Upload } from "lucide-react";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { Lead, DashboardStats } from "@/types/lead";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface ExportButtonsProps {
  leads: Lead[];
  stats: DashboardStats;
  dashboardRef: React.RefObject<HTMLDivElement>;
  onImportLeads?: (importedLeads: Lead[]) => void; // NOVO
}

const ExportButtons = ({ leads, stats, dashboardRef, onImportLeads }: ExportButtonsProps) => {
  // Exportar leads para Excel
  const exportToExcel = () => {
    try {
      const data = leads.map(lead => ({
        Nome: lead.nome,
        Empresa: lead.empresa,
        Email: lead.email,
        Telefone: lead.telefone,
        Endereço: lead.endereco,
        Cidade: lead.cidade,
        Estado: lead.estado,
        Região: lead.regiao,
        Status: lead.status,
        Temperatura: lead.temperatura,
        'Em Projeção': lead.emProjecao ? 'Sim' : 'Não',
        'Detalhes Status': lead.detalhesStatus,
        'Data da Visita': lead.dataVisita || '',
        'Data de Criação': lead.dataCriacao,
        'Última Atualização': lead.dataUltimaAtualizacao
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Leads');
      XLSX.writeFile(wb, 'leads.xlsx');
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      toast.error("Erro ao exportar Excel");
    }
  };

  // Exportar leads para PDF
  const exportToPDF = () => {
    try {
      const doc = new jsPDF('l', 'mm', 'a4');
      doc.setFont("helvetica");

      const tableData = leads.map(lead => [
        lead.nome,
        lead.empresa,
        lead.email,
        lead.telefone,
        `${lead.cidade}, ${lead.estado}`,
        lead.regiao,
        lead.status,
        lead.temperatura,
        lead.emProjecao ? 'Sim' : 'Não',
        lead.detalhesStatus || '-',
        lead.dataVisita || '-'
      ]);

      const head = [[
        'Nome', 'Empresa', 'Email', 'Telefone', 'Localização', 'Região',
        'Status', 'Temperatura', 'Em Projeção', 'Detalhes Status', 'Data Visita'
      ]];

      autoTable(doc, {
        head,
        body: tableData,
        styles: { fontSize: 8, cellPadding: 1, overflow: 'linebreak', font: 'helvetica', halign: 'center', valign: 'middle' },
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontSize: 8, fontStyle: 'bold', halign: 'center' },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 25 },
          2: { cellWidth: 35 },
          3: { cellWidth: 20 },
          4: { cellWidth: 30 },
          5: { cellWidth: 15 },
          6: { cellWidth: 15 },
          7: { cellWidth: 15 },
          8: { cellWidth: 15 },
          9: { cellWidth: 30 },
          10: { cellWidth: 20 }
        },
        margin: { top: 20, left: 10, right: 10 },
        pageBreak: 'auto',
        rowPageBreak: 'avoid',
        theme: 'grid',
        didDrawPage: () => {
          doc.setFontSize(15);
          doc.text('Lista de Leads', doc.internal.pageSize.getWidth() / 2, 12, { align: 'center' });
        }
      });

      doc.save('lista-leads.pdf');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error("Erro ao exportar PDF");
    }
  };

  // Exportar dashboard para PDF
  const exportDashboardToPDF = async () => {
    if (!dashboardRef.current) return;

    try {
      const canvas = await html2canvas(dashboardRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      pdf.addImage(imgData, 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
      pdf.save('dashboard.pdf');
    } catch (error) {
      console.error('Erro ao exportar dashboard:', error);
      toast.error("Erro ao exportar dashboard");
    }
  };

  // Importar leads
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      const content = e.target?.result as string;
      try {
        const imported = JSON.parse(content) as Lead[];
        if (onImportLeads) onImportLeads(imported);
        toast.success("Leads importados com sucesso!");
      } catch {
        toast.error("Erro ao importar. Verifique o arquivo JSON.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 text-blue-600 hover:text-blue-600">
          <Download className="h-4 w-4" />
          Exportar
          <ChevronDown className="h-4 w-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={exportToExcel} className="flex items-center gap-2 hover:text-blue-600">
          <FileSpreadsheet className="h-4 w-4" />
          Exportar para Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF} className="flex items-center gap-2 hover:text-blue-600">
          <FileText className="h-4 w-4" />
          Exportar Lista em PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportDashboardToPDF} className="flex items-center gap-2 hover:text-blue-600">
          <Download className="h-4 w-4" />
          Exportar Dashboard em PDF
        </DropdownMenuItem>
        {/* Botão de importação */}
        <DropdownMenuItem className="flex items-center gap-2 hover:text-blue-600 cursor-pointer">
          <label className="flex items-center gap-2 cursor-pointer">
            <Upload className="h-4 w-4" />
            Importar Leads
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportButtons;
