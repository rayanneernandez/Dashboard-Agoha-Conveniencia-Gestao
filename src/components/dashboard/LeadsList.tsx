import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, Users, Phone, Mail, MapPin, Edit, Trash2 } from "lucide-react";
import EditLeadDialog from "./EditLeadDialog";
import LeadForm from "./LeadForm";
import { Lead, ESTADOS_BRASILEIROS } from "@/types/lead";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

const LeadsList = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterEstado, setFilterEstado] = useState("todos");

  // 🔎 Buscar leads
  const fetchLeads = async () => {
    const { data, error } = await supabase.from("leads").select("*");
    if (error) {
      console.error("Erro ao buscar leads:", error.message);
      toast.error("Erro ao carregar leads");
    } else {
      setLeads(data as Lead[]);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // ✏️ Editar lead
  const handleEditLead = async (id: string, leadData: Partial<Lead>) => {
    const { error } = await supabase.from("leads").update(leadData).eq("id", id);
    if (error) {
      toast.error("Erro ao atualizar lead");
    } else {
      toast.success("Lead atualizado com sucesso!");
      fetchLeads();
    }
  };

  // ❌ Deletar lead
  const handleDeleteLead = async (id: string) => {
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir lead");
    } else {
      toast.success("Lead excluído com sucesso!");
      setLeads(leads.filter((lead) => lead.id !== id));
    }
  };

  // 🔍 Filtros
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.cidade?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

    const matchesStatus =
      filterStatus === "todos" ||
      (filterStatus === "ativos" && lead.status.toLowerCase() === "ativo") ||
      (filterStatus === "inativos" && lead.status.toLowerCase() === "inativo") ||
      (filterStatus === "quentes" && lead.temperatura.toLowerCase() === "quente") ||
      (filterStatus === "frios" && lead.temperatura.toLowerCase() === "frio");

    const matchesEstado = filterEstado === "todos" || lead.estado === filterEstado;

    return matchesSearch && matchesStatus && matchesEstado;
  });

  // 🏷️ Badges
  const getStatusBadge = (status: string) =>
    status.toLowerCase() === "ativo" ? <Badge variant="default">Ativo</Badge> : <Badge variant="outline">Inativo</Badge>;

  const getTemperaturaBadge = (temperatura: string) =>
    temperatura.toLowerCase() === "quente" ? <Badge variant="default">🔥 Quente</Badge> : <Badge variant="outline">❄️ Frio</Badge>;

  return (
    <Card className="shadow-card border-0">
      <CardHeader className="bg-gradient-total text-primary-foreground rounded-t-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <CardTitle>Lista de Leads</CardTitle>
        </div>
        <LeadForm onLeadCreated={fetchLeads} />
        <CardDescription className="text-primary-foreground/80 mt-2 md:mt-0">
          Gerencie todos os seus leads cadastrados
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6">
        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por nome, empresa ou cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filtrar status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos Status</SelectItem>
              <SelectItem value="ativos">Ativos</SelectItem>
              <SelectItem value="inativos">Inativos</SelectItem>
              <SelectItem value="quentes">Quentes</SelectItem>
              <SelectItem value="frios">Frios</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterEstado} onValueChange={setFilterEstado}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filtrar estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos Estados</SelectItem>
              {ESTADOS_BRASILEIROS.map((estado) => (
                <SelectItem key={estado.sigla} value={estado.sigla}>
                  {estado.sigla} - {estado.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Temperatura</TableHead>
                <TableHead>Projeção</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => (
                <TableRow key={lead.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div>
                      <p className="font-medium">{lead.nome}</p>
                      <p className="text-sm text-muted-foreground">{lead.empresa}</p>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      {lead.email && (
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" />
                          {lead.email}
                        </div>
                      )}
                      {lead.telefone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          {lead.telefone}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span className="text-sm">
                        {lead.cidade && `${lead.cidade}, `} {lead.estado}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{lead.regiao}</p>
                  </TableCell>

                  <TableCell>{getStatusBadge(lead.status)}</TableCell>
                  <TableCell>{getTemperaturaBadge(lead.temperatura)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{lead.emProjecao ? "Sim" : "Não"}</TableCell>

                  <TableCell>
                    <div className="flex gap-2">
                      <EditLeadDialog lead={lead} onEditLead={handleEditLead} />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o lead "{lead.empresa}"? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteLead(lead.id)}>Excluir</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Nenhum lead */}
        {filteredLeads.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum lead encontrado com os filtros aplicados</p>
          </div>
        )}

        <div className="mt-4 text-sm text-muted-foreground">
          Mostrando {filteredLeads.length} de {leads.length} leads
        </div>
      </CardContent>
    </Card>
  );
};

export default LeadsList;
