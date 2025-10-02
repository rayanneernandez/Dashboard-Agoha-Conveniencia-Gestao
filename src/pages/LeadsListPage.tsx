import { useState, useEffect } from "react";
import { Lead } from "@/types/lead";
import LeadsList from "@/components/dashboard/LeadsList";
import LeadsListSimplificado from "@/components/dashboard/LeadsListSimplificado";
import SideMenu from "@/components/dashboard/SideMenu";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface LeadsListPageProps {
  filter: 'all' | 'ativos' | 'inativos' | 'leads' | 'clientes' | 'quentes';
}

const LeadsListPage = ({ filter }: LeadsListPageProps) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const normalizeVisitafeita = (v: boolean | "Sim" | "Não"): "Sim" | "Não" =>
    v === true || v === "Sim" ? "Sim" : "Não";

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("leads").select("*");
      if (error) return toast.error(`Erro ao carregar leads: ${error.message}`);
      if (data) {
        const normalizedLeads = data.map((l) => ({
          ...l,
          visitafeita: normalizeVisitafeita(l.visitafeita),
        }));
        setLeads(normalizedLeads);
      }
    } catch {
      toast.error("Erro inesperado ao carregar leads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Filtrar leads com base no parâmetro filter
  useEffect(() => {
    if (filter === 'ativos') {
      setFilteredLeads(leads.filter(lead => lead.status === 'Ativo' || lead.status === 'Cliente'));
    } else if (filter === 'inativos') {
      setFilteredLeads(leads.filter(lead => lead.status === 'Inativo' || lead.status === 'Cancelado'));
    } else if (filter === 'leads') {
      // Apenas leads (não clientes nem cancelados)
      const onlyLeads = leads.filter(lead => lead.status === "Lead");
      // Ordenar com quentes primeiro
      const sortedLeads = [...onlyLeads].sort((a, b) => {
        if (a.temperatura === "Quente" && b.temperatura !== "Quente") return -1;
        if (a.temperatura !== "Quente" && b.temperatura === "Quente") return 1;
        return 0;
      });
      setFilteredLeads(sortedLeads);
    } else if (filter === 'clientes') {
      // Clientes e cancelados
      setFilteredLeads(leads.filter(lead => lead.status === "Cliente" || lead.status === "Cancelado"));
    } else if (filter === 'quentes') {
      // Apenas quentes
      setFilteredLeads(leads.filter(lead => lead.temperatura === "Quente"));
    } else {
      setFilteredLeads(leads);
    }
  }, [leads, filter]);

  const handleEditLead = async (id: string, leadData: Omit<Lead, "id" | "dataultimaatualizacao">) => {
    const dataToUpdate = {
      ...leadData,
      dataultimaatualizacao: new Date().toISOString(),
      visitafeita: leadData.visitafeita === "Sim" ? "Sim" : "Não",
    };

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

  // Título baseado no filtro
  const getPageTitle = () => {
    switch (filter) {
      case 'ativos': return 'Clientes Ativos';
      case 'inativos': return 'Leads Inativos';
      case 'leads': return 'Todos os Leads';
      case 'clientes': return 'Clientes';
      case 'quentes': return 'Leads Quentes';
      default: return 'Todos os Leads';
    }
  };

  // Determinar se deve usar o componente simplificado
  const useSimplifiedComponent = filter === 'ativos' || filter === 'inativos' || filter === 'clientes';

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <SideMenu 
        leads={leads} 
        onImportLeads={(importedLeads) => {
          const normalizedLeads = importedLeads.map(l => ({
            ...l,
            visitafeita: normalizeVisitafeita(l.visitafeita)
          }));
          setLeads(prev => [...prev, ...normalizedLeads]);
        }}
      />
      
      <div className="bg-gradient-header text-white py-3 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-4 ml-16 md:ml-20">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Logo AgHora"
              className="h-16 md:h-10 w-auto object-contain flex-shrink-0"
            />
            <div className="flex flex-col justify-center">
              <h1 className="text-2xl font-bold leading-tight">{getPageTitle()}</h1>
              <p className="text-white/80 text-sm">Total: {filteredLeads.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {loading ? (
          <div className="flex justify-center items-center h-[70vh]">
            <Loader2 className="h-12 w-12 animate-spin text-[#660629]" />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-4">
            {useSimplifiedComponent ? (
                <LeadsListSimplificado leads={filteredLeads} />
            ) : (
              <LeadsList
                leads={filteredLeads}
                onEditLead={handleEditLead}
                onDeleteLead={handleDeleteLead}
                onDeleteMultipleLeads={handleDeleteMultipleLeads}
                filter={filter as any}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadsListPage;