import { useState, useMemo, useEffect, useRef } from "react";
import { UserCheck, UserX, Flame, Snowflake, Target } from "lucide-react";
import { Lead, LeadFormData, DashboardStats, mapLeadToDB } from "@/types/lead";
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

  const normalizeVisitafeita = (v: boolean | "Sim" | "Não"): "Sim" | "Não" =>
    v === true || v === "Sim" ? "Sim" : "Não";

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase.from("leads").select("*");
      if (error) return toast.error(`Erro ao carregar leads: ${error.message}`);
      if (data) {
        setLeads(
          data.map((l) => ({
            ...l,
            visitafeita: normalizeVisitafeita(l.visitafeita),
          }))
        );
      }
    } catch {
      toast.error("Erro inesperado ao carregar leads");
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const stats: DashboardStats = useMemo(() => {
    const totalLeads = leads.length;
    const leadsAtivos = leads.filter((l) => l.status === "Ativo").length;
    const leadsInativos = leads.filter((l) => l.status === "Inativo").length;
    const leadsQuentes = leads.filter((l) => l.temperatura === "Quente").length;
    const leadsFrios = leads.filter((l) => l.temperatura === "Frio").length;
    const leadsEmProjecao = leads.filter((l) => l.emProjecao ?? false).length;

    const distribuicaoPorRegiao = leads.reduce(
      (acc, lead) => {
        acc[lead.regiao] = (acc[lead.regiao] || 0) + 1;
        return acc;
      },
      { Norte: 0, Nordeste: 0, "Centro-Oeste": 0, Sudeste: 0, Sul: 0 }
    );

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

  const handleAddLead = async (leadData: LeadFormData) => {
    const newLeadToInsert = mapLeadToDB({
      ...leadData,
      dataultimaatualizacao: new Date().toISOString(),
    });

    const { data, error } = await supabase
      .from("leads")
      .insert([newLeadToInsert])
      .select("*");

    if (error) return toast.error(`Erro ao cadastrar lead: ${error.message}`);
    if (data && data.length > 0) {
      setLeads((prev) => [
        ...prev,
        { ...data[0], visitafeita: normalizeVisitafeita(data[0].visitafeita) },
      ]);
    }
  };

  const handleEditLead = async (id: string, leadData: Omit<Lead, "id" | "dataultimaatualizacao">) => {
    const dataToUpdate = mapLeadToDB({
      ...leadData,
      dataultimaatualizacao: new Date().toISOString(),
      visitafeita: leadData.visitafeita === "Sim",
    });

    const { data, error } = await supabase
      .from("leads")
      .update(dataToUpdate)
      .eq("id", id)
      .select("*");

    if (error) return toast.error(`Erro ao atualizar lead: ${error.message}`);
    if (data && data.length > 0) {
      setLeads((prev) =>
        prev.map((l) =>
          l.id === id ? { ...data[0], visitafeita: normalizeVisitafeita(data[0].visitafeita) } : l
        )
      );
    }
  };

  const handleDeleteLead = async (id: string) => {
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) return toast.error(`Erro ao excluir lead: ${error.message}`);
    setLeads((prev) => prev.filter((l) => l.id !== id));
  };

  // Nova função: exclusão múltipla
  const handleDeleteMultipleLeads = async (ids: string[]) => {
    try {
      const { error } = await supabase.from("leads").delete().in("id", ids);
      if (error) throw error;
      setLeads((prev) => prev.filter((l) => !ids.includes(l.id)));
      toast.success("Leads selecionados deletados com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao deletar leads selecionados");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-gradient-header text-white py-3 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
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
            <ImportLeads
              onImportLeads={(importedLeads) =>
                setLeads((prev) => [
                  ...prev,
                  ...importedLeads
                    .filter((l) => l.status === "Ativo")
                    .map((l) => ({ ...l, visitafeita: normalizeVisitafeita(l.visitafeita) })),
                ])
              }
            />
            <LeadForm onAddLead={handleAddLead} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div ref={dashboardRef}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
            <MetricCard title="Total de Leads" value={stats.totalLeads} description="Total geral" icon={UserCheck} variant="total" />
            <MetricCard title="Leads Ativos" value={stats.leadsAtivos} description="Em operação" icon={UserCheck} variant="success" />
            <MetricCard title="Leads Inativos" value={stats.leadsInativos} description="Fora de operação" icon={UserX} variant="danger" />
            <MetricCard title="Leads Quentes" value={stats.leadsQuentes} description="Potencial fechamento" icon={Flame} variant="warning" />
            <MetricCard title="Leads Frios" value={stats.leadsFrios} description="Baixo potencial" icon={Snowflake} variant="info" />
            <MetricCard title="Em Projeção" value={stats.leadsEmProjecao} description="Fundamentalmente certo" icon={Target} variant="purple" />
          </div>

          <CustomBrazilMap leads={leads} />
          <ChartsSection leads={leads} dashboardRef={dashboardRef} />
        </div>

        <LeadsList
          leads={leads}
          onEditLead={handleEditLead}
          onDeleteLead={handleDeleteLead}
          onDeleteMultipleLeads={handleDeleteMultipleLeads}
        />
      </div>
    </div>
  );
};

export default Index;
