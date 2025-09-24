import { useState, useMemo, useEffect, useRef } from "react";  // Adicionado useRef
import { Users, UserCheck, UserX, Flame, Snowflake, Target } from "lucide-react";
import { Lead, DashboardStats } from "@/types/lead";
import MetricCard from "@/components/dashboard/MetricCard";
import LeadForm from "@/components/dashboard/LeadForm";
import LeadsList from "@/components/dashboard/LeadsList";
import CustomBrazilMap from "@/components/dashboard/CustomBrazilMap";
import ChartsSection from "@/components/dashboard/ChartsSection";
import ExportButtons from "@/components/dashboard/ExportButtons";  // Novo import
import { toast } from "sonner";

const STORAGE_KEY = 'dashboard_leads';  // Chave para o localStorage

const Index = () => {
  // Inicializar o estado com dados do localStorage, se existirem
  const [leads, setLeads] = useState<Lead[]>(() => {
    const savedLeads = localStorage.getItem(STORAGE_KEY);
    return savedLeads ? JSON.parse(savedLeads) : [];
  });

  const dashboardRef = useRef<HTMLDivElement>(null);  // Referência para o dashboard

  // Salvar no localStorage sempre que leads for atualizado
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
  }, [leads]);

  // Estatísticas do dashboard
  const stats: DashboardStats = useMemo(() => {
    const totalLeads = leads.length;
    const leadsAtivos = leads.filter(lead => lead.status === 'Ativo').length;
    const leadsInativos = leads.filter(lead => lead.status === 'Inativo').length;
    const leadsQuentes = leads.filter(lead => lead.temperatura === 'Quente').length;
    const leadsFrios = leads.filter(lead => lead.temperatura === 'Frio').length;
    const leadsEmProjecao = leads.filter(lead => lead.emProjecao ?? false).length;

    const distribuicaoPorRegiao = leads.reduce((acc, lead) => {
      const regiao = lead.regiao === 'Centro-Oeste' ? 'CentroOeste' : lead.regiao;
      acc[regiao as keyof typeof acc] = (acc[regiao as keyof typeof acc] || 0) + 1;
      return acc;
    }, {
      Norte: 0,
      Nordeste: 0,
      CentroOeste: 0,
      Sudeste: 0,
      Sul: 0,
    });

    return {
      totalLeads,
      leadsAtivos,
      leadsInativos,
      leadsQuentes,
      leadsFrios,
      leadsEmProjecao,
      distribuicaoPorRegiao,
    };
  }, [leads]);

  // Adicionar lead
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

  // Editar lead
  const handleEditLead = (id: string, leadData: Omit<Lead, 'id' | 'dataCriacao' | 'dataUltimaAtualizacao'>) => {
    setLeads(prev =>
      prev.map(lead =>
        lead.id === id
          ? { ...leadData, id, dataCriacao: lead.dataCriacao, dataUltimaAtualizacao: new Date().toISOString().split('T')[0] }
          : lead
      )
    );
    toast.success("Lead atualizado com sucesso!");
  };

  // Excluir lead
  const handleDeleteLead = (id: string) => {
    setLeads(prev => prev.filter(lead => lead.id !== id));
    toast.success("Lead excluído com sucesso!");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-total text-primary-foreground p-6 shadow-card">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-foreground/20 rounded-lg">
                <Users className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Dashboard de Leads</h1>
                <p className="text-primary-foreground/80">AgoHa Conveniência</p>
              </div>
            </div>
            <div className="flex gap-2">
              <ExportButtons leads={leads} stats={stats} dashboardRef={dashboardRef} />
              <LeadForm onAddLead={handleAddLead} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Área do Dashboard que será exportada */}
        <div ref={dashboardRef}>
          {/* Cards de métricas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
            <MetricCard title="Total de Leads" value={stats.totalLeads} description="Total geral" icon={Users} variant="total" />
            <MetricCard title="Leads Ativos" value={stats.leadsAtivos} description="Em operação" icon={UserCheck} variant="success" />
            <MetricCard title="Leads Inativos" value={stats.leadsInativos} description="Fora de operação" icon={UserX} variant="danger" />
            <MetricCard title="Leads Quentes" value={stats.leadsQuentes} description="Potencial fechamento" icon={Flame} variant="warning" />
            <MetricCard title="Leads Frios" value={stats.leadsFrios} description="Baixo potencial" icon={Snowflake} variant="info" />
            <MetricCard title="Em Projeção" value={stats.leadsEmProjecao} description="Fundamentalmente certo" icon={Target} variant="success" />
          </div>

          {/* Mapa do Brasil */}
          <CustomBrazilMap leads={leads} />

          {/* Gráficos */}
          <ChartsSection leads={leads} />
        </div>

        {/* Lista de leads */}
        <LeadsList leads={leads} onEditLead={handleEditLead} onDeleteLead={handleDeleteLead} />
      </div>
    </div>
  );
};

export default Index;
