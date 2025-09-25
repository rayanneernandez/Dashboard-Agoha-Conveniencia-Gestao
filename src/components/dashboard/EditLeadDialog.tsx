import { useState } from "react";
import { Lead, ESTADOS_BRASILEIROS } from "@/types/lead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit } from "lucide-react";

// Cria um tipo extendido com campos extras
type EditableLead = Omit<Lead, 'id' | 'dataCriacao' | 'dataUltimaAtualizacao' | 'coordenadas'> & {
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
    empresa: lead.empresa,
    email: lead.email,
    telefone: lead.telefone,
    endereco: lead.endereco,
    cidade: lead.cidade,
    estado: lead.estado,
    regiao: lead.regiao,
    status: lead.status,
    temperatura: lead.temperatura,
    detalhesStatus: lead.detalhesStatus,
    emProjecao: lead.emProjecao,
    cep: (lead as any).cep || "",
    numero: (lead as any).numero || "",
    bairro: (lead as any).bairro || "",
  });

  const handleInputChange = <K extends keyof EditableLead>(field: K, value: EditableLead[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.empresa || !formData.email) {
      alert("Preencha os campos obrigatórios: Nome, Empresa e Email.");
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
              <Input value={formData.nome} onChange={(e) => handleInputChange('nome', e.target.value)} required />
            </div>
            <div>
              <Label>Empresa *</Label>
              <Input value={formData.empresa} onChange={(e) => handleInputChange('empresa', e.target.value)} required />
            </div>
            <div>
              <Label>Email *</Label>
              <Input type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} required />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={formData.telefone} onChange={(e) => handleInputChange('telefone', e.target.value)} />
            </div>
            <div>
              <Label>CEP</Label>
              <Input value={formData.cep} onChange={(e) => handleInputChange('cep', e.target.value)} />
            </div>
            <div>
              <Label>Endereço</Label>
              <Input value={formData.endereco} onChange={(e) => handleInputChange('endereco', e.target.value)} />
            </div>
            <div>
              <Label>Número</Label>
              <Input value={formData.numero} onChange={(e) => handleInputChange('numero', e.target.value)} />
            </div>
            <div>
              <Label>Bairro</Label>
              <Input value={formData.bairro} onChange={(e) => handleInputChange('bairro', e.target.value)} />
            </div>
            <div>
              <Label>Cidade</Label>
              <Input value={formData.cidade} onChange={(e) => handleInputChange('cidade', e.target.value)} />
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={formData.estado} onValueChange={(v) => handleInputChange('estado', v as typeof formData.estado)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ESTADOS_BRASILEIROS.map(e => <SelectItem key={e.sigla} value={e.sigla}>{e.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Região</Label>
              <Select value={formData.regiao} onValueChange={(v) => handleInputChange('regiao', v as typeof formData.regiao)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Norte','Nordeste','Centro-Oeste','Sudeste','Sul'].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => handleInputChange('status', v as typeof formData.status)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Temperatura</Label>
              <Select value={formData.temperatura} onValueChange={(v) => handleInputChange('temperatura', v as typeof formData.temperatura)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Quente">Quente</SelectItem>
                  <SelectItem value="Frio">Frio</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Detalhes do Status</Label>
            <Textarea value={formData.detalhesStatus} onChange={(e) => handleInputChange('detalhesStatus', e.target.value)} rows={3} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit">Salvar Alterações</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditLeadDialog;
