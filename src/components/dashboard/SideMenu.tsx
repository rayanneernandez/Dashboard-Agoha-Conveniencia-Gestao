import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, Users, UserCheck, UserX, Map, Download, Upload, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import autoTable from "jspdf-autotable";
import { Lead, DashboardStats } from "@/types/lead";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

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

  const menuItems = [
    { 
      title: "Dashboard", 
      icon: <Menu className="h-5 w-5" />, 
      path: "/", 
      filter: "all",
      count: null
    },
    { 
      title: "Todos os Leads", 
      icon: <Users className="h-5 w-5" />, 
      path: "/leads", 
      filter: "leads",
      count: leads.filter(lead => lead.status === "Lead").length
    },
    { 
      title: "Clientes", 
      icon: <UserCheck className="h-5 w-5" />, 
      path: "/clientes", 
      filter: "clientes",
      count: leads.filter(lead => lead.status === "Cliente" || lead.status === "Cancelado").length
    },
    { 
      title: "Quentes", 
      icon: <UserX className="h-5 w-5" />, 
      path: "/quentes", 
      filter: "quentes",
      count: leads.filter(lead => lead.temperatura === "Quente").length
    },
    { 
      title: "Mapa", 
      icon: <Map className="h-5 w-5" />, 
      path: "/mapa", 
      filter: "mapa",
      count: null
    }
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
          Temperatura: lead.temperatura,
          "Detalhes Status": lead.detalhesStatus,
        };
      });

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Leads");

      XLSX.writeFile(wb, "leads.xlsx");
      setIsOpen(false);
    } catch (error) {
      console.error("Erro ao exportar Excel:", error);
      toast.error("Erro ao exportar para Excel");
    }
  };

  // Exportar Leads  PDF (tabela)
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

      const head = [
        [
          "Nome",
          "Razão Social",
          "Email",
          "Telefone",
          "Cidade",
          "Estado",
          "Visita Feita",
          "Status",
          "Temperatura",
        ],
      ];

      doc.setFontSize(18);
      doc.setTextColor(102, 6, 41);
      doc.text("Lista de Leads - AgHora Conveniência", 14, 22);

      autoTable(doc, {
        head: head,
        body: tableData,
        startY: 30,
        theme: "grid",
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [102, 6, 41],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
      });

      doc.save("leads.pdf");
      setIsOpen(false);
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      toast.error("Erro ao exportar para PDF");
    }
  };

  // Exportar Dashboard para PDF
  const exportDashboardToPDF = () => {
    if (!dashboardRef?.current) {
      toast.error("Não foi possível exportar o dashboard");
      return;
    }

    try {
      const element = dashboardRef.current;
      
      html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#F8F9FA',
      }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('l', 'mm', 'a4');
        
        // Dimensões da página A4 paisagem
        const pdfWidth = 297;
        const pdfHeight = 210;
        
        // Calcular dimensões para manter proporção
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight) * 0.9;
        
        // Calcular posição para centralizar
        const xPos = (pdfWidth - imgWidth * ratio) / 2;
        const yPos = 20;
        
        // Adicionar título
        pdf.setFontSize(18);
        pdf.setTextColor(102, 6, 41);
        pdf.text('Dashboard de Leads - AgHora Conveniência', pdfWidth / 2, 10, { align: 'center' });
        
        // Adicionar imagem
        pdf.addImage(imgData, 'PNG', xPos, yPos, imgWidth * ratio, imgHeight * ratio);
        
        pdf.save('dashboard.pdf');
        setIsOpen(false);
      });
    } catch (error) {
      console.error("Erro ao exportar dashboard:", error);
      toast.error("Erro ao exportar dashboard");
    }
  };

  // Importar Leads
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
                onImportLeads(importedLeads as Lead[]);
          toast.success(`${importedLeads.length} leads importados com sucesso!`);
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

  const processImportedData = async (jsonData: any[]) => {
    // Lógica simplificada de processamento de dados importados
    return jsonData.map((row) => {
      const estado = row["Estado"] || "SP";
      const regiao = obterRegiaoPorEstado(estado);
      
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
        estado: estado,
        regiao: regiao,
        status: row["Status"] === "Inativo" ? "Inativo" : "Ativo",
        temperatura: row["Temperatura"] === "Quente" ? "Quente" : row["Temperatura"] === "Frio" ? "Frio" : null,
        emProjecao: false,
        detalhesStatus: row["Detalhes Status"] || "",
        visitafeita: row["Visita feita"] === "Sim" ? "Sim" : "Não",
        dataultimaatualizacao: new Date().toISOString(),
      };
    });
  };

  const obterRegiaoPorEstado = (estado: string) => {
    const regioes: Record<string, string> = {
      "AC": "Norte", "AM": "Norte", "AP": "Norte", "PA": "Norte", "RO": "Norte", "RR": "Norte", "TO": "Norte",
      "AL": "Nordeste", "BA": "Nordeste", "CE": "Nordeste", "MA": "Nordeste", "PB": "Nordeste", 
      "PE": "Nordeste", "PI": "Nordeste", "RN": "Nordeste", "SE": "Nordeste",
      "DF": "Centro-Oeste", "GO": "Centro-Oeste", "MS": "Centro-Oeste", "MT": "Centro-Oeste",
      "ES": "Sudeste", "MG": "Sudeste", "RJ": "Sudeste", "SP": "Sudeste",
      "PR": "Sul", "RS": "Sul", "SC": "Sul"
    };
    
    return regioes[estado] || "Sudeste";
  };

  return (
    <>
      {/* Botão do menu hamburguer reposicionado */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="fixed top-4 left-4 z-50 text-white hover:bg-transparent md:top-6 md:left-6 w-12 h-12 flex items-center justify-center"
        onClick={toggleMenu}
        style={{position: 'fixed'}}
      >
        <Menu className="h-6 w-6" />
      </Button>

      {/* Overlay para fechar o menu quando clicar fora */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

     {/* Menu lateral */}
    <div className={cn(
        "fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-40 transition-transform duration-300 transform flex flex-col",
            isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
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
            
            {/* Exportar para Excel */}
            <li>
              <button
                className="flex items-center gap-3 w-full p-3 rounded-md transition-colors hover:bg-[#fce4ec] text-gray-700"
                onClick={exportToExcel}
              >
                <FileSpreadsheet className="h-5 w-5 text-[#660629]" />
                <span>Exportar em Excel</span>
              </button>
            </li>
            
            {/* Exportar para PDF */}
            <li>
              <button
                className="flex items-center gap-3 w-full p-3 rounded-md transition-colors hover:bg-[#fce4ec] text-gray-700"
                onClick={exportLeadsToPDF}
              >
                <FileText className="h-5 w-5 text-[#660629]" />
                <span>Exportar Leads em PDF</span>
              </button>
            </li>
            
            {/* Exportar Dashboard para PDF */}
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
            
            {/* Importar Leads */}
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
