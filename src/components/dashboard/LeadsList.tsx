import { useState, useEffect } from "react";
import { Lead, ESTADOS_BRASILEIROS } from "@/types/lead";
import EditLeadDialog from "@/components/dashboard/EditLeadDialog";
import ViewLeadDialog from "@/components/dashboard/ViewLeadDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";

interface LeadsListProps {
  leads: Lead[];
  onEditLead: (
    id: string,
    leadData: Omit<Lead, "id" | "dataultimaatualizacao">
  ) => void;
  onDeleteLead: (id: string) => void; // Exclusão individual
  onDeleteMultipleLeads: (ids: string[]) => void; // Exclusão múltipla
  filter?: 'all' | 'ativos' | 'inativos' | 'leads' | 'clientes' | 'quentes';
}

const LeadsList: React.FC<LeadsListProps> = ({
  leads,
  onEditLead,
  onDeleteLead,
  onDeleteMultipleLeads,
  filter,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterEstado, setFilterEstado] = useState("todos");
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>(leads);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    setFilteredLeads(
      leads.filter((lead) => {
        const matchesSearch =
          lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.razaosocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (lead.cidade?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

        let matchesStatus = true;
        if (filter === 'leads') {
          // Filtro para a página de leads
          if (filterStatus !== "todos") {
            matchesStatus = lead.temperatura === filterStatus;
          }
        } else if (filter === 'clientes') {
          // Filtro para a página de clientes
          if (filterStatus !== "todos") {
            matchesStatus = lead.status === filterStatus;
          }
        } else {
          // Filtros padrão para outras páginas
          matchesStatus =
            filterStatus === "todos" ||
            (filterStatus === "Cliente" && lead.status === "Cliente") ||
            (filterStatus === "Cancelado" && lead.status === "Cancelado") ||
            (filterStatus === "Lead" && lead.status === "Lead") ||
            (filterStatus === "Quente" && lead.temperatura === "Quente") ||
            (filterStatus === "Morno" && lead.temperatura === "Morno") ||
            (filterStatus === "Frio" && lead.temperatura === "Frio");
        }

        const matchesEstado =
          filterEstado === "todos" || lead.estado === filterEstado;

        return matchesSearch && matchesStatus && matchesEstado;
      })
    );
  }, [leads, searchTerm, filterStatus, filterEstado, filter]);

  // Selecionar/desmarcar todos
  const toggleSelectAll = () => {
    if (selectAll) setSelectedLeads(new Set());
    else setSelectedLeads(new Set(filteredLeads.map((lead) => lead.id)));
    setSelectAll(!selectAll);
  };

  // Selecionar/desmarcar um lead
  const toggleSelectLead = (id: string) => {
    const newSet = new Set(selectedLeads);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedLeads(newSet);
  };

  // Deletar múltiplos leads
  const handleDeleteMultiple = () => {
    if (selectedLeads.size === 0) return;
    onDeleteMultipleLeads(Array.from(selectedLeads));
    setSelectedLeads(new Set());
    setSelectAll(false);
  };

  // Renderizar filtros específicos baseados no tipo de página
  const renderFilters = () => {
    if (filter === 'leads') {
      return (
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Filtrar por temperatura" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas temperaturas</SelectItem>
            <SelectItem value="Quente">Quente</SelectItem>
            <SelectItem value="Morno">Morno</SelectItem>
            <SelectItem value="Frio">Frio</SelectItem>
          </SelectContent>
        </Select>
      );
    } else if (filter === 'clientes') {
      return (
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos status</SelectItem>
            <SelectItem value="Cliente">Cliente</SelectItem>
            <SelectItem value="Cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      );
    } else {
      return (
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="Cliente">Cliente</SelectItem>
            <SelectItem value="Cancelado">Cancelado</SelectItem>
            <SelectItem value="Lead">Lead</SelectItem>
            <SelectItem value="Quente">Quente</SelectItem>
            <SelectItem value="Morno">Morno</SelectItem>
            <SelectItem value="Frio">Frio</SelectItem>
          </SelectContent>
        </Select>
      );
    }
  };

  // Determinar se deve mostrar a coluna de temperatura
  const showTemperatureColumn = filter !== 'clientes';

  // Determinar se deve mostrar todas as ações ou apenas visualização
  const showAllActions = filter !== 'clientes';

  return (
    <div className="mt-6">
      {/* Barra de busca e filtros */}
      <div className="flex gap-4 mb-4 items-center">
        <Input
          placeholder="Buscar por nome, razão social ou cidade"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {renderFilters()}
        <Select value={filterEstado} onValueChange={setFilterEstado}>
          <SelectTrigger>
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {ESTADOS_BRASILEIROS.map((e) => (
              <SelectItem key={e.sigla} value={e.sigla}>
                {e.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedLeads.size > 0 && (
          <Button variant="destructive" onClick={handleDeleteMultiple}>
            Excluir Selecionados ({selectedLeads.size})
          </Button>
        )}
      </div>

      {/* Tabela de leads */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <input
                type="checkbox"
                checked={selectAll}
                onChange={toggleSelectAll}
              />
            </TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Endereço / Número</TableHead>
            <TableHead>Cidade</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Status</TableHead>
            {showTemperatureColumn && <TableHead>Temperatura</TableHead>}
            <TableHead>Detalhes Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredLeads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell>
                <input
                  type="checkbox"
                  checked={selectedLeads.has(lead.id)}
                  onChange={() => toggleSelectLead(lead.id)}
                />
              </TableCell>
              <TableCell>{lead.nome}</TableCell>
              <TableCell>
                {lead.endereco} {lead.numero}
              </TableCell>
              <TableCell>{lead.cidade}</TableCell>
              <TableCell>{lead.estado}</TableCell>
              <TableCell>
                <Badge
                  variant={lead.status === "Cliente" ? "default" : "outline"}
                >
                  {lead.status}
                </Badge>
              </TableCell>
              {showTemperatureColumn && (
                <TableCell>
                  <Badge
                    variant={lead.temperatura === "Quente" ? "default" : "outline"}
                  >
                    {lead.temperatura || ""}
                  </Badge>
                </TableCell>
              )}
              <TableCell>{lead.detalhesStatus}</TableCell>
              <TableCell className="flex gap-2">
                {/* Botão de visualizar (sempre presente) */}
                <ViewLeadDialog lead={lead} />

                {/* Editar e Excluir (apenas em algumas páginas) */}
                {showAllActions && (
                  <>
                    <EditLeadDialog lead={lead} onEditLead={onEditLead} />

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Tem certeza que deseja excluir?
                          </AlertDialogTitle>
                        </AlertDialogHeader>
                        <div className="flex justify-end gap-2 mt-4">
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDeleteLead(lead.id)}
                          >
                            Excluir
                          </AlertDialogAction>
                        </div>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default LeadsList;
