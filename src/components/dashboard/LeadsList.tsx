import { useState, useEffect } from "react";
import { Lead, ESTADOS_BRASILEIROS } from "@/types/lead";
import EditLeadDialog, { EditableLead } from "@/components/dashboard/EditLeadDialog";
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
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,  // Adicionando esta importação
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";

interface LeadsListProps {
  leads: Lead[];
  onEditLead: (id: string, leadData: EditableLead) => void;
  onDeleteLead: (id: string) => void;
  onDeleteMultipleLeads: (ids: string[]) => void; 
  filter?: 'all' | 'ativos' | 'inativos' | 'leads' | 'clientes' | 'quentes';
  onRefresh?: () => Promise<void>;
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
          if (filterStatus !== "todos") {
            matchesStatus = lead.temperatura === filterStatus;
          }
        } else if (filter === 'clientes') {
          if (filterStatus !== "todos") {
            matchesStatus = 
              (filterStatus === "Cliente" && lead.status === "Cliente") ||
              (filterStatus === "Cancelado" && lead.status === "Cancelado") ||
              (filterStatus === "Em Projeção" && lead.emProjecao);
          }
        } else {
          matchesStatus =
            filterStatus === "todos" ||
            (filterStatus === "Cliente" && lead.status === "Cliente") ||
            (filterStatus === "Cancelado" && lead.status === "Cancelado") ||
            (filterStatus === "Lead" && lead.status === "Lead") ||
            (filterStatus === "Em Projeção" && lead.emProjecao) ||
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

  const toggleSelectAll = () => {
    if (selectAll) setSelectedLeads(new Set());
    else setSelectedLeads(new Set(filteredLeads.map((lead) => lead.id)));
    setSelectAll(!selectAll);
  };

  const toggleSelectLead = (id: string) => {
    const newSet = new Set(selectedLeads);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedLeads(newSet);
  };

  const handleDeleteMultiple = () => {
    if (selectedLeads.size === 0) return;
    onDeleteMultipleLeads(Array.from(selectedLeads));
    setSelectedLeads(new Set());
    setSelectAll(false);
  };

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
            <SelectItem value="Em Projeção">Em Projeção</SelectItem>
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
            <SelectItem value="Em Projeção">Em Projeção</SelectItem>
            <SelectItem value="Quente">Quente</SelectItem>
            <SelectItem value="Morno">Morno</SelectItem>
            <SelectItem value="Frio">Frio</SelectItem>
          </SelectContent>
        </Select>
      );
    }
  };

  const showTemperatureColumn = filter !== 'clientes';
  const showAllActions = filter !== 'clientes';

  return (
    <div className="mt-6">
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
            <TableHead>Em Projeção</TableHead>
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
              <TableCell>
                <Badge variant={lead.emProjecao ? "default" : "outline"}>
                  {lead.emProjecao ? "Sim" : "Não"}
                </Badge>
              </TableCell>
              <TableCell className="flex gap-2">
                <ViewLeadDialog lead={lead} />
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
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O lead será removido.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={async () => {
                              console.log('Clique no botão de excluir detectado'); // Debug log 1
                              console.log('ID do lead a ser excluído:', lead.id); // Debug log 2
                              try {
                                await onDeleteLead(lead.id);
                                console.log('Função onDeleteLead chamada com sucesso'); // Debug log 3
                              } catch (err) {
                                console.error('Erro ao chamar onDeleteLead:', err); // Debug log 4
                              }
                            }}
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
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
