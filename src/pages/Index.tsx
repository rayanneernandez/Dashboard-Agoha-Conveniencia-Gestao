import { useState, useMemo, useEffect, useRef } from "react";
import { UserCheck, UserX, Flame, Snowflake, Target } from "lucide-react";
import { Lead, LeadFormData, DashboardStats, mapLeadToDB } from "@/types/lead";
import MetricCard from "@/components/dashboard/MetricCard";
import LeadForm from "@/components/dashboard/LeadForm";
import LeadsList from "@/components/dashboard/LeadsList";
import CustomBrazilMap from "@/components/dashboard/CustomBrazilMap";
import ChartsSection, { RegionPieChart } from "@/components/dashboard/ChartsSection";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import DashboardLayout from "@/components/layout/DashboardLayout";

const Index = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase.from("leads").select("*");
      if (error) throw error;
      setLeads(data.map((l: any) => ({ ...l, dataultimaatualizacao: new Date(l.dataultimaatualizacao).toISOString() })));
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar leads");
    }
  };

  useEffect(() => { fetchLeads(); }, []);

  const dashboardStats = useMemo<DashboardStats>(() => ({
    totalLeads: leads.filter(l => l.status === "Lead").length,
    leadsAtivos: leads.filter(l => l.status === "Cliente").length,
    leadsInativos: leads.filter(l => l.status === "Cancelado").length,
    leadsQuentes: leads.filter(l => l.temperatura === "Quente").length,
    leadsFrios: leads.filter(l => l.temperatura === "Frio").length,
    leadsEmProjecao: leads.filter(l => l.emProjecao).length,
    distribuicaoPorRegiao: {
      Norte: leads.filter(l => l.regiao === "Norte").length,
      Nordeste: leads.filter(l => l.regiao === "Nordeste").length,
      "Centro-Oeste": leads.filter(l => l.regiao === "Centro-Oeste").length,
      Sudeste: leads.filter(l => l.regiao === "Sudeste").length,
      Sul: leads.filter(l => l.regiao === "Sul").length,
    },
  }), [leads]);

  const handleAddLead = async (leadData: LeadFormData) => {
    try {
      const dbLead = mapLeadToDB(leadData);
      const { data, error } = await supabase.from("leads").insert([dbLead]).select();
      if (error) throw error;
      if (data && data.length > 0) setLeads(prev => [...prev, { id: data[0].id, ...dbLead }]);
      toast.success("Lead adicionado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao adicionar lead");
    }
  };

  const handleEditLead = (id: string, leadData: Omit<Lead, "id" | "dataultimaatualizacao">) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...leadData } : l));
    toast.success("Lead atualizado!");
  };

  const handleDeleteLead = async (id: string) => {
    try {
      // Primeiro, verifica se o lead existe
      const { data: existingLead, error: checkError } = await supabase
        .from("leads")
        .select("id")
        .eq("id", id);
  
      if (checkError) {
        console.error("Erro ao verificar lead:", checkError);
        toast.error("Erro ao verificar lead");
        return;
      }
  
      if (!existingLead || existingLead.length === 0) {
        console.error("Lead não encontrado");
        toast.error("Lead não encontrado");
        return;
      }
  
      // Tenta excluir o lead
      const { error: deleteError } = await supabase
        .from("leads")
        .delete()
        .eq("id", id);
  
      if (deleteError) {
        console.error("Erro ao excluir lead:", deleteError);
        toast.error(`Erro ao excluir lead: ${deleteError.message}`);
        return;
      }
  
      // Recarrega a lista completa após a exclusão
      const { data: updatedData, error: fetchError } = await supabase
        .from("leads")
        .select("*");
  
      if (fetchError) {
        console.error("Erro ao recarregar leads:", fetchError);
        toast.error("Erro ao atualizar a lista");
        return;
      }
  
      // Atualiza o estado com os dados mais recentes
      setLeads(updatedData.map((l: any) => ({ 
        ...l, 
        dataultimaatualizacao: new Date(l.dataultimaatualizacao).toISOString() 
      })));
      
      toast.success("Lead excluído com sucesso!");
  
    } catch (err) {
      console.error("Erro completo:", err);
      toast.error("Erro ao excluir lead");
    }
  };
  
  const handleDeleteMultipleLeads = async (ids: string[]) => {
    try {
      const { error } = await supabase.from("leads").delete().in("id", ids);
      if (error) throw error;
      
      // Atualiza o estado local apenas se a exclusão no banco foi bem-sucedida
      setLeads(prev => prev.filter(l => !ids.includes(l.id)));
      toast.success("Leads selecionados excluídos com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao excluir leads selecionados.");
    }
  };

  return (
    <DashboardLayout leads={leads} onAddLead={handleAddLead}>
      <div className="flex flex-col space-y-6 p-6" ref={dashboardRef}>
        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricCard title="Total de Leads" value={dashboardStats.totalLeads} icon={<Target className="h-5 w-5"/>} description="Quentes, Frios e Mornos" variant="total"/>
          <MetricCard title="Clientes" value={dashboardStats.leadsAtivos} icon={<UserCheck className="h-5 w-5"/>} description="Cadastrados" variant="success"/>
          <MetricCard title="Leads Mornos" value={leads.filter(l => l.temperatura === "Morno").length} icon={<UserX className="h-5 w-5"/>} description="Temperatura média" variant="danger"/>
          <MetricCard title="Leads Quentes" value={dashboardStats.leadsQuentes} icon={<Flame className="h-5 w-5"/>} description="Potencial fechamento" variant="warning"/>
          <MetricCard title="Leads Frios" value={dashboardStats.leadsFrios} icon={<Snowflake className="h-5 w-5"/>} description="Baixo potencial" variant="info"/>
          <MetricCard title="Em Projeção" value={dashboardStats.leadsEmProjecao} icon={<Target className="h-5 w-5"/>} description="Fundamentalmente certo" variant="success"/>
        </div>

        {/* Mapas e gráficos */}
        <div className="bg-white rounded-lg shadow p-0"><CustomBrazilMap leads={leads}/></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow">
            <div className="bg-[#8E0D3C] p-4 text-white rounded-t-lg flex items-center gap-2"><Flame className="h-5 w-5"/><h3 className="text-lg font-semibold">Leads por Estado</h3></div>
            <div className="p-6 bg-white rounded-b-lg"><ChartsSection leads={leads}/></div>
          </div>
          <div className="bg-white rounded-lg shadow">
            <div className="bg-[#FF6900] p-4 text-white rounded-t-lg flex items-center gap-2"><Target className="h-5 w-5"/><h3 className="text-lg font-semibold">Distribuição por Região</h3></div>
            <div className="p-6 bg-white rounded-b-lg h-[350px]"><RegionPieChart leads={leads}/></div>
          </div>
        </div>

        {/* Lista de Leads */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Leads Recentes</h2>
          <LeadsList leads={leads} onEditLead={handleEditLead} onDeleteLead={handleDeleteLead} onDeleteMultipleLeads={handleDeleteMultipleLeads}/>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
