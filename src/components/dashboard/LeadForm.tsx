import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, UserPlus, Loader2 } from "lucide-react";
import { Lead, ESTADOS_BRASILEIROS } from "@/types/lead";
import { toast } from "sonner";

interface LeadFormProps {
  onAddLead: (lead: Omit<Lead, 'id' | 'dataCriacao' | 'dataUltimaAtualizacao'>) => void;
}

interface ViaCEPResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

const LeadForm = ({ onAddLead }: LeadFormProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    empresa: '',
    email: '',
    telefone: '',
    cep: '',
    endereco: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    status: 'Ativo' as Lead['status'],
    temperatura: 'Quente' as Lead['temperatura'],
    emProjecao: false,
    detalhesStatus: '',
    dataVisita: ''
  });

  const handleCEPChange = async (cep: string) => {
    const cleanCEP = cep.replace(/\D/g, '');
    if (cleanCEP.length === 8) {
      setLoading(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
        const data: ViaCEPResponse = await response.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            endereco: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
            estado: data.uf
          }));
        } else {
          toast.error("CEP não encontrado");
        }
      } catch {
        toast.error("Erro ao buscar CEP");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.empresa || !formData.estado) {
      toast.error("Por favor, preencha os campos obrigatórios");
      return;
    }

    const estadoSelecionado = ESTADOS_BRASILEIROS.find(estado => estado.sigla === formData.estado);

    const newLead: Omit<Lead, 'id' | 'dataCriacao' | 'dataUltimaAtualizacao'> = {
      ...formData,
      endereco: `${formData.endereco} ${formData.numero}`.trim(),
      regiao: estadoSelecionado?.regiao || 'Sudeste'
    };

    onAddLead(newLead);

    // Reset do formulário
    setFormData({
      nome: '',
      empresa: '',
      email: '',
      telefone: '',
      cep: '',
      endereco: '',
      numero: '',
      bairro: '',
      cidade: '',
      estado: '',
      status: 'Ativo',
      temperatura: 'Quente',
      emProjecao: false,
      detalhesStatus: '',
      dataVisita: ''
    });

    setOpen(false);
    toast.success("Lead cadastrado com sucesso!");
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-white text-blue-600 border border-blue-600 shadow-card hover:bg-blue-50 hover:scale-105 transition-all duration-300"
      >
        <Plus className="h-4 w-4 mr-2" />
        Novo Lead
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Cadastrar Novo Lead
            </DialogTitle>
            <DialogDescription>
              Adicione um novo lead ao seu pipeline de vendas
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome e Empresa */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome do contato"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="empresa">Empresa *</Label>
                <Input
                  id="empresa"
                  value={formData.empresa}
                  onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                  placeholder="Nome da empresa"
                  required
                />
              </div>
            </div>

            {/* Email e Telefone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            {/* CEP */}
            <div className="space-y-2">
              <Label htmlFor="cep">CEP</Label>
              <div className="relative">
                <Input
                  id="cep"
                  value={formData.cep}
                  onChange={(e) => {
                    const cep = e.target.value;
                    setFormData({ ...formData, cep });
                    handleCEPChange(cep);
                  }}
                  placeholder="00000-000"
                  maxLength={9}
                />
                {loading && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {/* Endereço e Número */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  placeholder="Rua, Avenida, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numero">Número</Label>
                <Input
                  id="numero"
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  placeholder="Número do endereço"
                />
              </div>
            </div>

            {/* Bairro, Cidade, Estado */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bairro">Bairro</Label>
                <Input
                  id="bairro"
                  value={formData.bairro}
                  onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                  placeholder="Bairro"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  placeholder="Cidade"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado">Estado *</Label>
                <Select
                  value={formData.estado}
                  onValueChange={(value) => setFormData({ ...formData, estado: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_BRASILEIROS.map((estado) => (
                      <SelectItem key={estado.sigla} value={estado.sigla}>
                        {estado.nome} ({estado.sigla})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Data da Visita */}
            <div className="space-y-2">
              <Label htmlFor="dataVisita">Data da Visita</Label>
              <Input
                id="dataVisita"
                type="date"
                value={formData.dataVisita}
                onChange={(e) => setFormData({ ...formData, dataVisita: e.target.value })}
              />
            </div>

            {/* Status, Temperatura e Projeção */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: Lead['status']) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="temperatura">Temperatura</Label>
                <Select
                  value={formData.temperatura}
                  onValueChange={(value: Lead['temperatura']) => setFormData({ ...formData, temperatura: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Quente">Quente</SelectItem>
                    <SelectItem value="Frio">Frio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="emProjecao"
                checked={formData.emProjecao}
                onCheckedChange={(checked) => setFormData({ ...formData, emProjecao: checked as boolean })}
              />
              <Label htmlFor="emProjecao">Lead em Projeção</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="submit" className="bg-blue-600 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Lead
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LeadForm;
