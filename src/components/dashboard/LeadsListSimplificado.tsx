import { useState, useEffect } from "react";
import { Lead, ESTADOS_BRASILEIROS } from "@/types/lead";
import ViewLeadDialog from "@/components/dashboard/ViewLeadDialog";
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
import { Badge } from "@/components/ui/badge";

interface LeadsListSimplificadoProps {
  leads: Lead[];
}

const LeadsListSimplificado: React.FC<LeadsListSimplificadoProps> = ({
  leads,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState("todos");
  const [filterProjecao, setFilterProjecao] = useState("todos"); // ✅ novo filtro
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>(leads);

  useEffect(() => {
    setFilteredLeads(
      leads.filter((lead) => {
        const matchesSearch =
          lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.razaosocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (lead.cidade?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

        const matchesEstado =
          filterEstado === "todos" || lead.estado === filterEstado;

        const matchesProjecao =
          filterProjecao === "todos"
            ? true
            : filterProjecao === "sim"
            ? lead.emProjecao === true
            : lead.emProjecao === false;

        return matchesSearch && matchesEstado && matchesProjecao;
      })
    );
  }, [leads, searchTerm, filterEstado, filterProjecao]);

  return (
    <div className="mt-6">
      {/* Barra de busca e filtros */}
      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <Input
          placeholder="Buscar por nome, razão social ou cidade"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 min-w-[250px]"
        />

        <Select value={filterEstado} onValueChange={setFilterEstado}>
          <SelectTrigger>
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os estados</SelectItem>
            {ESTADOS_BRASILEIROS.map((e) => (
              <SelectItem key={e.sigla} value={e.sigla}>
                {e.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* ✅ Novo filtro: Em Projeção */}
        <Select value={filterProjecao} onValueChange={setFilterProjecao}>
          <SelectTrigger>
            <SelectValue placeholder="Filtrar por projeção" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="sim">Em projeção</SelectItem>
            <SelectItem value="nao">Não em projeção</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela de leads */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Endereço / Número</TableHead>
            <TableHead>Cidade</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Em Projeção</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredLeads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell>{lead.nome}</TableCell>
              <TableCell>
                {lead.endereco} {lead.numero}
              </TableCell>
              <TableCell>{lead.cidade}</TableCell>
              <TableCell>{lead.estado}</TableCell>
              <TableCell>
                <Badge
                  variant={lead.status === "Ativo" ? "default" : "outline"}
                >
                  {lead.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={lead.emProjecao ? "default" : "outline"}>
                  {lead.emProjecao ? "Sim" : "Não"}
                </Badge>
              </TableCell>
              <TableCell>
                <ViewLeadDialog lead={lead} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default LeadsListSimplificado;
