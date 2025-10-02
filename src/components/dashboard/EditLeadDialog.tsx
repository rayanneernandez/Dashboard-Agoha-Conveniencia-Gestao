import { useState } from "react";
import { Lead, ESTADOS_BRASILEIROS } from "@/types/lead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit } from "lucide-react";

// Tipo para campos editáveis
type EditableLead = Omit<
  Lead,
  "id" | "dataultimaatualizacao" | "coordenadas"
> & {
  cep?: string;
  numero?: string;
  bairro?: string;
};

interface EditLeadDialogProps {
  lead: Lead;
  onEditLead: (id: string, leadData: EditableLead) => void;
}

const EditLeadDialog = ({ lead, onEditLead }: EditLeadDialogProps) => {
  const [open, setOpen] = useState(false);

  const [formData, setFormData] = useState<EditableLead>({
    nome: lead.nome,
    razaosocial: lead.razaosocial,
    email: lead.email,
    telefone: lead.telefone,
    endereco: lead.endereco,
    cidade: lead.cidade,
    estado: lead.estado,
    regiao: lead.regiao,
    status: lead.status,
    temperatura: lead.temperatura,
    detalhesStatus: lead.detalhesStatus,
    emProjecao: lead.emProjecao, // já carregado do lead
    visitafeita: lead.visitafeita,
    cep: (lead as any).cep || "",
    numero: (lead as any).numero || "",
    bairro: (lead as any).bairro || "",
  });

  const handleInputChange = <K extends keyof EditableLead>(
    field: K,
    value: EditableLead[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validação mínima
    if (!formData.nome) {
      alert("Preencha o campo obrigatório: Nome.");
      return;
    }
    onEditLead(lead.id, formData);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Lead</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nome *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => handleInputChange("nome", e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Razão Social</Label>
              <Input
                value={formData.razaosocial}
                onChange={(e) =>
                  handleInputChange("razaosocial", e.target.value)
                }
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input
                value={formData.telefone}
                onChange={(e) => handleInputChange("telefone", e.target.value)}
              />
            </div>
            <div>
              <Label>CEP</Label>
              <Input
                value={formData.cep}
                onChange={(e) => handleInputChange("cep", e.target.value)}
              />
            </div>
            <div>
              <Label>Endereço</Label>
              <Input
                value={formData.endereco}
                onChange={(e) => handleInputChange("endereco", e.target.value)}
              />
            </div>
            <div>
              <Label>Número</Label>
              <Input
                value={formData.numero}
                onChange={(e) => handleInputChange("numero", e.target.value)}
              />
            </div>
            <div>
              <Label>Bairro</Label>
              <Input
                value={formData.bairro}
                onChange={(e) => handleInputChange("bairro", e.target.value)}
              />
            </div>
            <div>
              <Label>Cidade</Label>
              <Input
                value={formData.cidade}
                onChange={(e) => handleInputChange("cidade", e.target.value)}
              />
            </div>
            <div>
              <Label>Estado</Label>
              <Select
                value={formData.estado}
                onValueChange={(v) => handleInputChange("estado", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS_BRASILEIROS.map((e) => (
                    <SelectItem key={e.sigla} value={e.sigla}>
                      {e.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Região</Label>
              <Select
                value={formData.regiao}
                onValueChange={(v) =>
                  handleInputChange("regiao", v as typeof formData.regiao)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul"].map(
                    (r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
            
            
            <div>
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) =>
                  handleInputChange("status", v as "Ativo" | "Inativo" | "Cliente" | "Cancelado" | "Lead")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cliente">Cliente</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                  <SelectItem value="Lead">Lead</SelectItem>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(formData.status === "Lead" || formData.status === "Inativo") && (
              <div>
                <Label>Temperatura</Label>
                <Select
                  value={formData.temperatura ?? ""}
                  onValueChange={(v) =>
                    handleInputChange("temperatura", v as "Quente" | "Morno" | "Frio")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Quente">Quente</SelectItem>
                    <SelectItem value="Morno">Morno</SelectItem>
                    <SelectItem value="Frio">Frio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Visita Feita</Label>
              <Select
                value={formData.visitafeita}
                onValueChange={(v) =>
                  handleInputChange("visitafeita", v as "Sim" | "Não")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sim">Sim</SelectItem>
                  <SelectItem value="Não">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Checkbox
                checked={formData.emProjecao}
                onCheckedChange={(checked) =>
                  handleInputChange("emProjecao", checked === true)
                }
              />
              <Label>Projeção</Label>
            </div>
          </div>

          <div>
            <Label>Detalhes do Status</Label>
            <Textarea
              value={formData.detalhesStatus}
              onChange={(e) =>
                handleInputChange("detalhesStatus", e.target.value)
              }
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">Salvar Alterações</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditLeadDialog;
