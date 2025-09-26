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
import { supabase } from "@/lib/supabaseClient";

interface LeadFormProps {
  onAddLead?: (leadData: Omit<Lead, "id" | "dataultimaatualizacao">) => void;
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

type TemperaturaForm = "Quente" | "Frio" | null;

const LeadForm = ({ onAddLead }: LeadFormProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<
    Omit<Lead, "id" | "dataultimaatualizacao"> & {
      cep: string;
      numero: string;
      bairro: string;
      temperatura: TemperaturaForm;
    }
  >({
    nome: "",
    razaosocial: "",
    email: "",
    telefone: "",
    cep: "",
    endereco: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
    regiao: "Sudeste",
    status: "Ativo",
    temperatura: null,
    emProjecao: false,
    detalhesStatus: "",
    dataVisita: "",
  });

  // Busca automática do CEP
  const handleCEPChange = async (cep: string) => {
    const cleanCEP = cep.replace(/\D/g, "");
    setFormData((prev) => ({ ...prev, cep }));
    if (cleanCEP.length === 8) {
      setLoading(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
        const data: ViaCEPResponse = await response.json();
        if (!data.erro) {
          setFormData((prev) => ({
            ...prev,
            endereco: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
            estado: data.uf,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.razaosocial || !formData.estado) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    const estadoSelecionado = ESTADOS_BRASILEIROS.find((e) => e.sigla === formData.estado);

    const newLead: Omit<Lead, "id" | "dataultimaatualizacao"> & {
      cep: string;
      numero: string;
      bairro: string;
      temperatura: "Quente" | "Frio" | null;
    } = {
      ...formData,
      regiao: estadoSelecionado?.regiao || "Sudeste",
      dataVisita: formData.dataVisita || null,
      temperatura: formData.temperatura, // null se nenhuma
    };

    try {
      const { error } = await supabase.from("leads").insert([newLead]);
      if (error) {
        toast.error("Erro ao cadastrar lead no banco: " + error.message);
        return;
      }
    } catch (err) {
      toast.error("Erro ao cadastrar lead no banco");
      console.error(err);
      return;
    }

    // Reset form
    setFormData({
      nome: "",
      razaosocial: "",
      email: "",
      telefone: "",
      cep: "",
      endereco: "",
      numero: "",
      bairro: "",
      cidade: "",
      estado: "",
      regiao: "Sudeste",
      status: "Ativo",
      temperatura: null,
      emProjecao: false,
      detalhesStatus: "",
      dataVisita: "",
    });

    setOpen(false);
    toast.success("Lead cadastrado com sucesso!");
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-white text-[#660629] border border-[#660629] shadow-card hover:bg-[#fce4ec] hover:scale-105 transition-all duration-300 flex items-center gap-2"
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
            <DialogDescription>Adicione um novo lead ao seu pipeline de vendas</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome e Razão Social */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nome</Label>
                <Input value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} />
              </div>
              <div>
                <Label>Razão Social *</Label>
                <Input
                  value={formData.razaosocial}
                  onChange={(e) => setFormData({ ...formData, razaosocial: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Email e Telefone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input value={formData.telefone} onChange={(e) => setFormData({ ...formData, telefone: e.target.value })} />
              </div>
            </div>

            {/* CEP */}
            <div>
              <Label>CEP</Label>
              <div className="relative">
                <Input
                  value={formData.cep}
                  onChange={(e) => handleCEPChange(e.target.value)}
                  placeholder="00000-000"
                  maxLength={9}
                />
                {loading && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
              </div>
            </div>

            {/* Endereço, Número e Bairro */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Endereço</Label>
                <Input value={formData.endereco} onChange={(e) => setFormData({ ...formData, endereco: e.target.value })} />
              </div>
              <div>
                <Label>Número</Label>
                <Input value={formData.numero} onChange={(e) => setFormData({ ...formData, numero: e.target.value })} />
              </div>
              <div>
                <Label>Bairro</Label>
                <Input value={formData.bairro} onChange={(e) => setFormData({ ...formData, bairro: e.target.value })} />
              </div>
            </div>

            {/* Cidade e Estado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Cidade</Label>
                <Input value={formData.cidade} onChange={(e) => setFormData({ ...formData, cidade: e.target.value })} />
              </div>
              <div>
                <Label>Estado *</Label>
                <Select value={formData.estado} onValueChange={(v) => setFormData({ ...formData, estado: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
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
            </div>

            {/* Data da Última Visita */}
            <div>
              <Label>Data da Última Visita</Label>
              <Input
                type="date"
                value={formData.dataVisita || ""}
                onChange={(e) => setFormData({ ...formData, dataVisita: e.target.value })}
              />
            </div>

            {/* Status e Temperatura */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as "Ativo" | "Inativo" })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Temperatura</Label>
                <Select
                  value={formData.temperatura ?? "Nenhuma"}
                  onValueChange={(v) =>
                    setFormData({ ...formData, temperatura: v === "Nenhuma" ? null : (v as "Quente" | "Frio") })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nenhuma">Nenhuma</SelectItem>
                    <SelectItem value="Quente">Quente</SelectItem>
                    <SelectItem value="Frio">Frio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Detalhes do Status */}
            <div>
              <Label>Detalhes do Status</Label>
              <textarea
                value={formData.detalhesStatus}
                onChange={(e) => setFormData({ ...formData, detalhesStatus: e.target.value })}
                className="w-full border rounded px-2 py-1"
                placeholder="Descreva mais detalhes sobre o status"
              />
            </div>

            {/* Em Projeção */}
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={formData.emProjecao}
                onCheckedChange={(c) => setFormData({ ...formData, emProjecao: c as boolean })}
              />
              <Label>Em Projeção</Label>
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
