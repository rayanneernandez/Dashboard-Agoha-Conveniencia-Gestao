import { useState, useMemo, useEffect, useRef } from "react";
import { UserCheck, UserX, Flame, Snowflake, Target } from "lucide-react";
import { Lead, DashboardStats } from "@/types/lead";
import MetricCard from "@/components/dashboard/MetricCard";
import LeadForm from "@/components/dashboard/LeadForm";
import LeadsList from "@/components/dashboard/LeadsList";
import CustomBrazilMap from "@/components/dashboard/CustomBrazilMap";
import ChartsSection from "@/components/dashboard/ChartsSection";
import ExportButtons from "@/components/dashboard/ExportButtons";
import ImportLeads from "@/components/dashboard/ImportLeads";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

const Index = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const dashboardRef = useRef<HTMLDivElement>(null);

  // Buscar leads do Supabase
  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase.from("leads").select("*");
      if (error) {
        toast.error(`Erro ao carregar leads: ${error.message}`);
        return;
      }
      const mappedData: Lead[] = (data || []).map((l: any) => ({
        ...l,
        dataultimaatualizacao: l.dataultimaatualizacao,
      }));
      setLeads(mappedData);
    } catch {
      toast.error("Erro inesperado ao carregar leads");
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Estatísticas do dashboard
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

  const handleAddLead = async (leadData: Omit<Lead, 'id' | 'dataultimaatualizacao'>) => {
    const newLeadToInsert = {
      ...leadData,
      dataultimaatualizacao: new Date().toISOString().split('T')[0],
      emProjecao: leadData.emProjecao ?? false,
    };
    const { data, error } = await supabase.from("leads").insert(newLeadToInsert).select("*");
    if (error) {
      toast.error(`Erro ao cadastrar lead: ${error.message}`);
      return;
    }
    const mapped: Lead[] = (data || []).map((l: any) => ({
      ...l,
      dataultimaatualizacao: l.dataultimaatualizacao,
    }));
    setLeads(prev => [...prev, ...mapped]);
    toast.success("Lead cadastrado com sucesso!");
  };

  const handleEditLead = async (id: string, leadData: Omit<Lead, 'id' | 'dataultimaatualizacao'>) => {
    const updatedData = {
      ...leadData,
      dataultimaatualizacao: new Date().toISOString().split('T')[0],
    };
    const { data, error } = await supabase.from("leads").update(updatedData).eq("id", id).select("*");
    if (error) {
      toast.error(`Erro ao atualizar lead: ${error.message}`);
      return;
    }
    const mapped: Lead[] = (data || []).map((l: any) => ({
      ...l,
      dataultimaatualizacao: l.dataultimaatualizacao,
    }));
    setLeads(prev => prev.map(l => (l.id === id ? mapped[0] : l)));
    toast.success("Lead atualizado com sucesso!");
  };

  const handleDeleteLead = async (id: string) => {
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) {
      toast.error(`Erro ao excluir lead: ${error.message}`);
      return;
    }
    setLeads(prev => prev.filter(l => l.id !== id));
    toast.success("Lead excluído com sucesso!");
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
{/* Navbar */}
<div className="bg-gradient-header text-white py-3 px-6">
  <div className="max-w-7xl mx-auto flex justify-between items-center gap-4">
    <div className="flex items-center gap-3">
      <img 
        src="src/logo.png" 
        alt="Logo AgHora" 
        className="h-16 md:h-10 w-auto object-contain flex-shrink-0" 
      />
      <div className="flex flex-col justify-center">
        <h1 className="text-2xl font-bold leading-tight">Dashboard de Leads</h1>
        <p className="text-white/80 text-sm">AgHora Conveniência</p>
      </div>
    </div>
    <div className="flex gap-2 items-center">
      <ExportButtons leads={leads} stats={stats} dashboardRef={dashboardRef} />
      <ImportLeads onImportLeads={(importedLeads) => setLeads(prev => [...prev, ...importedLeads])} />
      <LeadForm onAddLead={handleAddLead} />
    </div>
  </div>
</div>




      {/* Dashboard */}
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div ref={dashboardRef}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
            <MetricCard title="Total de Leads" value={stats.totalLeads} description="Total geral" icon={UserCheck} variant="total" className="bg-gradient-total shadow-card card-hover" />
            <MetricCard title="Leads Ativos" value={stats.leadsAtivos} description="Em operação" icon={UserCheck} variant="success" className="bg-gradient-success shadow-card card-hover" />
            <MetricCard title="Leads Inativos" value={stats.leadsInativos} description="Fora de operação" icon={UserX} variant="danger" className="bg-gradient-danger shadow-card card-hover" />
            <MetricCard title="Leads Quentes" value={stats.leadsQuentes} description="Potencial fechamento" icon={Flame} variant="warning" className="bg-gradient-warning shadow-card card-hover" />
            <MetricCard title="Leads Frios" value={stats.leadsFrios} description="Baixo potencial" icon={Snowflake} variant="info" className="bg-gradient-info shadow-card card-hover" />
            <MetricCard title="Em Projeção" value={stats.leadsEmProjecao} description="Fundamentalmente certo" icon={Target} variant="purple" className="bg-gradient-projecao shadow-card card-hover" />
          </div>

          <CustomBrazilMap leads={leads} />
          <ChartsSection leads={leads} dashboardRef={dashboardRef} />
        </div>

        <LeadsList leads={leads} onEditLead={handleEditLead} onDeleteLead={handleDeleteLead} />
      </div>
    </div>
  );
};

export default Index;
