import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, Users, UserCheck, UserX, Map, Download, Upload, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import autoTable from "jspdf-autotable";
import { Lead, ESTADOS_BRASILEIROS } from "@/types/lead";
import { toast } from "sonner";

interface SideMenuProps {
  leads: any[];
  dashboardRef?: React.RefObject<HTMLDivElement>;
  onImportLeads?: (importedLeads: Lead[]) => void;
}

const SideMenu = ({ leads, dashboardRef, onImportLeads }: SideMenuProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Função para obter a região com base no estado
  const obterRegiaoPorEstado = (estado: string): Lead['regiao'] => {
    const estadoInfo = ESTADOS_BRASILEIROS.find(e => e.sigla === estado);
    return estadoInfo?.regiao || 'Sul'; // 'Sul' como fallback
  };

  // Função processImportedData
  const processImportedData = async (jsonData: any[]): Promise<Lead[]> => {
    return jsonData.map((row) => {
      const estado = row.Estado || "";
      return {
        id: Math.random().toString(36).substr(2, 9),
        nome: row.Nome || "",
        razaosocial: row["Razão Social"] || "",
        email: row.Email || "",
        telefone: row.Telefone || "",
        endereco: row.Endereço || "",
        numero: row.Numero || "",
        bairro: row.Bairro || "",
        cidade: row.Cidade || "",
        estado: estado,
        regiao: obterRegiaoPorEstado(estado),
        visitafeita: row["Visita feita"] || "Não",
        status: (row.Status || "Lead") as Lead["status"],
        temperatura: (row.Temperatura || null) as Lead["temperatura"],
        emProjecao: row["Em Projeção"] === "Sim",
        detalhesStatus: row["Detalhes Status"] || "",
        dataultimaatualizacao: new Date().toISOString(),
        midias: [],
      };
    });
  };

  // Função handleFileChange
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImportLeads) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length > 0) {
          const importedLeads = await processImportedData(jsonData);
          onImportLeads(importedLeads);
          toast.success(`${importedLeads.length} leads importados com sucesso!`);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } else {
          toast.error("Nenhum dado encontrado na planilha");
        }
      } catch (error) {
        console.error("Erro ao processar arquivo:", error);
        toast.error("Erro ao processar arquivo");
      }
    };
    reader.readAsArrayBuffer(file);
    setIsOpen(false);
  };

  const menuItems = [
    { title: "Dashboard", icon: <Menu className="h-5 w-5" />, path: "/", filter: "all", count: null },
    { title: "Todos os Leads", icon: <Users className="h-5 w-5" />, path: "/leads", filter: "leads", count: leads.filter(lead => lead.status === "Lead").length },
    { title: "Clientes", icon: <UserCheck className="h-5 w-5" />, path: "/clientes", filter: "clientes", count: leads.filter(lead => lead.status === "Cliente" || lead.status === "Cancelado").length },
    { title: "Quentes", icon: <UserX className="h-5 w-5" />, path: "/quentes", filter: "quentes", count: leads.filter(lead => lead.temperatura === "Quente").length },
    { title: "Mapa", icon: <Map className="h-5 w-5" />, path: "/mapa", filter: "mapa", count: null }
  ];

  // Exportar Leads para Excel
  const exportToExcel = () => {
    try {
      const data = leads.map((lead) => {
        return {
          Nome: lead.nome,
          "Razão Social": lead.razaosocial,
          Email: lead.email,
          Telefone: lead.telefone,
          Endereço: lead.endereco,
          Numero: lead.numero,
          Bairro: lead.bairro,
          Cidade: lead.cidade,
          Estado: lead.estado,
          "Visita feita": lead.visitafeita,
          Status: lead.status,
          Temperatura: lead.temperatura || "-",
          "Em Projeção": lead.emProjecao ? "Sim" : "Não",
          "Detalhes Status": lead.detalhesStatus,
        };
      });
  
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Leads");
  
      XLSX.writeFile(wb, "leads.xlsx");
      setIsOpen(false);
      toast.success("Leads exportados com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar Excel:", error);
      toast.error("Erro ao exportar para Excel");
    }
  };

  // Exportar Leads para PDF
  const exportLeadsToPDF = () => {
    try {
      const doc = new jsPDF("l", "mm", "a4");
      const tableData = leads.map((lead) => [
        lead.nome,
        lead.razaosocial,
        lead.email,
        lead.telefone,
        lead.cidade,
        lead.estado,
        lead.visitafeita,
        lead.status,
        lead.temperatura || "-",
      ]);

      const head = [[ "Nome", "Razão Social", "Email", "Telefone", "Cidade", "Estado", "Visita Feita", "Status", "Temperatura" ]];

      doc.setFontSize(18);
      doc.setTextColor(102, 6, 41);
      doc.text("Lista de Leads - AgHora Conveniência", 14, 22);

      autoTable(doc, {
        head: head,
        body: tableData,
        startY: 30,
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [102, 6, 41], textColor: [255, 255, 255], fontStyle: "bold" },
      });

      doc.save("leads.pdf");
      setIsOpen(false);
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      toast.error("Erro ao exportar para PDF");
    }
  };

  // Exportar Dashboard para PDF
  const exportDashboardToPDF = async () => {
    if (!dashboardRef?.current) {
      toast.error("Não foi possível exportar o dashboard");
      return;
    }
  
    try {
      // Seleciona apenas as seções que queremos
      const contentDiv = dashboardRef.current.querySelector('.flex.flex-col.space-y-6.p-6');
      if (!contentDiv) {
        toast.error("Não foi possível encontrar o conteúdo do dashboard");
        return;
      }
  
      // Cria um container temporário
      const container = document.createElement('div');
      container.style.backgroundColor = '#FFFFFF';
      container.style.padding = '20px';
  
      // Clona apenas as três primeiras divs (métricas, mapa e gráficos)
      const children = Array.from(contentDiv.children).slice(0, 3);
      children.forEach(child => {
        container.appendChild(child.cloneNode(true));
      });
  
      // Adiciona o container ao documento temporariamente para captura
      document.body.appendChild(container);
  
      try {
        const canvas = await html2canvas(container, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#FFFFFF',
          logging: true
        });
  
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('l', 'mm', 'a4');
        
        const pdfWidth = 297; // A4 landscape
        const pdfHeight = 210;
        
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight) * 0.95;
        
        const xPos = (pdfWidth - imgWidth * ratio) / 2;
        const yPos = 20;
        
        pdf.setFontSize(18);
        pdf.setTextColor(102, 6, 41);
        pdf.text('Dashboard de Leads - AgHora Conveniência', pdfWidth / 2, 10, { align: 'center' });
        
        pdf.addImage(imgData, 'PNG', xPos, yPos, imgWidth * ratio, imgHeight * ratio);
        
        const dataHora = new Date().toLocaleString('pt-BR');
        pdf.setFontSize(10);
        pdf.setTextColor(128, 128, 128);
        pdf.text(`Exportado em: ${dataHora}`, 10, pdfHeight - 10);
        
        pdf.save('dashboard-resumo.pdf');
        toast.success("Dashboard exportado com sucesso!");
      } finally {
        // Sempre remove o container temporário
        document.body.removeChild(container);
      }
    } catch (error) {
      console.error("Erro ao exportar dashboard:", error);
      toast.error("Erro ao exportar dashboard");
    }
    
    // Fecha o menu após a exportação
    setIsOpen(false);
  };

  return (
    <>
      {/* Botão do menu */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="fixed top-2 left-2 z-40 transition-colors duration-200 w-10 h-10 flex items-center justify-center shadow-md
          bg-[#660629] text-white hover:bg-[#7a0731]"
        onClick={toggleMenu}
      >
        <Menu className="h-6 w-6" />
      </Button>
    
      {/* Overlay invisível que apenas captura cliques */}
      {isOpen && (
        <div 
          className="fixed inset-0"
          style={{ zIndex: 45 }}
          onClick={() => setIsOpen(false)}
        />
      )}
    
      {/* Menu lateral */}
      <div 
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-white shadow-xl transition-transform duration-300 transform",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ zIndex: 50 }}
      >
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-[#660629]">Dashboard de Leads</h2>
          <p className="text-sm text-gray-500">AgHora Conveniência</p>
        </div>

        <nav className="p-4 flex-1 overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.title}>
                <Link 
                  to={item.path}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-md transition-colors",
                    location.pathname === item.path 
                      ? "bg-[#660629] text-white" 
                      : "hover:bg-[#fce4ec] text-gray-700"
                  )}
                  onClick={() => {
                    if (window.innerWidth < 768) {
                      setIsOpen(false);
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    {React.cloneElement(item.icon, {
                      className: cn(
                        "h-5 w-5",
                        location.pathname === item.path ? "text-white" : "text-[#660629]"
                      )
                    })}
                    <span>{item.title}</span>
                  </div>
                  {item.count !== null && (
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs",
                      location.pathname === item.path 
                        ? "bg-white text-[#660629]" 
                        : "bg-[#660629] text-white"
                    )}>
                      {item.count}
                    </span>
                  )}
                </Link>
              </li>
            ))}
            
            {/* Seção de Exportação e Importação */}
            <li className="pt-4 mt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Ferramentas</h3>
            </li>
            
            <li>
              <button
                className="flex items-center gap-3 w-full p-3 rounded-md transition-colors hover:bg-[#fce4ec] text-gray-700"
                onClick={exportToExcel}
              >
                <FileSpreadsheet className="h-5 w-5 text-[#660629]" />
                <span>Exportar em Excel</span>
              </button>
            </li>
            
            <li>
              <button
                className="flex items-center gap-3 w-full p-3 rounded-md transition-colors hover:bg-[#fce4ec] text-gray-700"
                onClick={exportLeadsToPDF}
              >
                <FileText className="h-5 w-5 text-[#660629]" />
                <span>Exportar Leads em PDF</span>
              </button>
            </li>
            
            {dashboardRef && (
              <li>
                <button
                  className="flex items-center gap-3 w-full p-3 rounded-md transition-colors hover:bg-[#fce4ec] text-gray-700"
                  onClick={exportDashboardToPDF}
                >
                  <Download className="h-5 w-5 text-[#660629]" />
                  <span>Exportar Dashboard</span>
                </button>
              </li>
            )}
            
            {onImportLeads && (
              <li>
                <label
                  className="flex items-center gap-3 w-full p-3 rounded-md transition-colors hover:bg-[#fce4ec] text-gray-700 cursor-pointer"
                >
                  <Upload className="h-5 w-5 text-[#660629]" />
                  <span>Importar Leads</span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".xlsx,.xls"
                    className="hidden"
                  />
                </label>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </>
  );
};

export default SideMenu;