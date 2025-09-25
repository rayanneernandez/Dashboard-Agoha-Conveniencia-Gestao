import { useState, useMemo, useEffect, useRef } from "react";
import { Users, UserCheck, UserX, Flame, Snowflake, Target } from "lucide-react";
import { Lead, DashboardStats } from "@/types/lead";
import MetricCard from "@/components/dashboard/MetricCard";
import LeadForm from "@/components/dashboard/LeadForm";
import LeadsList from "@/components/dashboard/LeadsList";
import CustomBrazilMap from "@/components/dashboard/CustomBrazilMap";
import ChartsSection from "@/components/dashboard/ChartsSection";
import ExportButtons from "@/components/dashboard/ExportButtons";
import ImportLeads from "@/components/dashboard/ImportLeads"; // Botão de importação
import { toast } from "sonner";

const STORAGE_KEY = "dashboard_leads";

const Index = () => {
  const [leads, setLeads] = useState<Lead[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const dashboardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
  }, [leads]);

  const stats: DashboardStats = useMemo(() => {
    const totalLeads = leads.length;
    const leadsAtivos = leads.filter(l => l.status === "Ativo").length;
    const leadsInativos = leads.filter(l => l.status === "Inativo").length;
    const leadsQuentes = leads.filter(l => l.temperatura === "Quente").length;
    const leadsFrios = leads.filter(l => l.temperatura === "Frio").length;
    const leadsEmProjecao = leads.filter(l => l.emProjecao ?? false).length;

    const distribuicaoPorRegiao = leads.reduce((acc, lead) => {
      const regiao = lead.regiao === "Centro-Oeste" ? "CentroOeste" : lead.regiao;
      acc[regiao as keyof typeof acc] = (acc[regiao as keyof typeof acc] || 0) + 1;
      return acc;
    }, {
      Norte: 0, Nordeste: 0, CentroOeste: 0, Sudeste: 0, Sul: 0
    });

    return { totalLeads, leadsAtivos, leadsInativos, leadsQuentes, leadsFrios, leadsEmProjecao, distribuicaoPorRegiao };
  }, [leads]);

  const handleAddLead = (leadData: Omit<Lead, 'id' | 'dataCriacao' | 'dataUltimaAtualizacao'>) => {
    const newLead: Lead = {
      ...leadData,
      id: Date.now().toString(),
      dataCriacao: new Date().toISOString().split('T')[0],
      dataUltimaAtualizacao: new Date().toISOString().split('T')[0],
      emProjecao: leadData.emProjecao ?? false,
    };
    setLeads(prev => [...prev, newLead]);
    toast.success("Lead cadastrado com sucesso!");
  };

  const handleEditLead = (id: string, leadData: Omit<Lead, 'id' | 'dataCriacao' | 'dataUltimaAtualizacao'>) => {
    setLeads(prev =>
      prev.map(lead =>
        lead.id === id
          ? { ...lead, ...leadData, dataUltimaAtualizacao: new Date().toISOString().split('T')[0] }
          : lead
      )
    );
    toast.success("Lead atualizado com sucesso!");
  };

  const handleDeleteLead = (id: string) => {
    setLeads(prev => prev.filter(l => l.id !== id));
    toast.success("Lead excluído com sucesso!");
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Navbar */}
      <div className="bg-gradient-header text-white p-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg"><Users className="h-8 w-8" /></div>
            <div>
              <h1 className="text-3xl font-bold">Dashboard de Leads</h1>
              <p className="text-white/80">AgoHa Conveniência</p>
            </div>
          </div>
          gma <div className="flex gap-2 items-center">
            <ExportButtons leads={leads} stats={stats} dashboardRef={dashboardRef} />
            <ImportLeads onImportLeads={(importedLeads) => setLeads(prev => [...prev, ...importedLeads])} />
            <LeadForm onAddLead={handleAddLead} />
          </div>

        </div>
      </div>

      {/* Dashboard */}
      <div className="max-w-7xl mx-auto p-6 space-y-8" ref={dashboardRef}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          <MetricCard title="Total de Leads" value={stats.totalLeads} description="Total geral" icon={Users} variant="total" className="bg-gradient-total shadow-card card-hover" />
          <MetricCard title="Leads Ativos" value={stats.leadsAtivos} description="Em operação" icon={UserCheck} variant="success" className="bg-gradient-success shadow-card card-hover" />
          <MetricCard title="Leads Inativos" value={stats.leadsInativos} description="Fora de operação" icon={UserX} variant="danger" className="bg-gradient-danger shadow-card card-hover" />
          <MetricCard title="Leads Quentes" value={stats.leadsQuentes} description="Potencial fechamento" icon={Flame} variant="warning" className="bg-gradient-warning shadow-card card-hover" />
          <MetricCard title="Leads Frios" value={stats.leadsFrios} description="Baixo potencial" icon={Snowflake} variant="info" className="bg-gradient-info shadow-card card-hover" />
          <MetricCard title="Em Projeção" value={stats.leadsEmProjecao} description="Fundamentalmente certo" icon={Target} variant="purple" className="bg-gradient-projecao shadow-card card-hover" />
        </div>

        <CustomBrazilMap leads={leads} />
        <ChartsSection leads={leads} />
        <LeadsList leads={leads} onEditLead={handleEditLead} onDeleteLead={handleDeleteLead} />
      </div>
    </div>
  );
};

export default Index;
