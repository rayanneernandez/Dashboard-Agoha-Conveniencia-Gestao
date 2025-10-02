import { useState } from "react"; 
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { Plus, UserPlus, Loader2 } from "lucide-react";
import { LeadFormData, ESTADOS_BRASILEIROS } from "@/types/lead";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox"; // ✅ adicionado

interface LeadFormProps {
  onAddLead?: (leadData: LeadFormData) => void;
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

  const [formData, setFormData] = useState<LeadFormData>({
    nome: "",
    razaosocial: "",
    email: "",
    telefone: "",
    endereco: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "SP",
    regiao: "Sudeste",
    status: "Lead", // Alterado para o novo valor padrão
    temperatura: null,
    emProjecao: false, // ✅ inicializado
    detalhesStatus: "",
    visitafeita: false,
  });

  const handleCEPChange = async (cep: string) => {
    const cleanCEP = cep.replace(/\D/g, "");
    if (cleanCEP.length === 8) {
      setLoading(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
        const data: ViaCEPResponse = await res.json();
        if (!data.erro) {
          setFormData((prev) => ({
            ...prev,
            endereco: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
            estado: data.uf as LeadFormData["estado"],
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

    onAddLead?.(formData);

    toast.success("Lead cadastrado com sucesso!");

    setFormData({
      nome: "",
      razaosocial: "",
      email: "",
      telefone: "",
      endereco: "",
      numero: "",
      bairro: "",
      cidade: "",
      estado: "SP",
      regiao: "Sudeste",
      status: "Ativo",
      temperatura: null,
      emProjecao: false,
      detalhesStatus: "",
      visitafeita: false,
    });

    setOpen(false);
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-white text-[#660629] border border-[#660629] shadow-card hover:bg-[#fce4ec]"
      >
        <Plus className="h-4 w-4" /> Novo Lead
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" /> Cadastrar Novo Lead
            </DialogTitle>
            <DialogDescription>
              Adicione um novo lead ao pipeline
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome e Razão Social */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nome</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Razão Social</Label>
                <Input
                  value={formData.razaosocial}
                  onChange={(e) =>
                    setFormData({ ...formData, razaosocial: e.target.value })
                  }
                />
              </div>
            </div>

            {/* E-mail e Telefone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input
                  value={formData.telefone}
                  onChange={(e) =>
                    setFormData({ ...formData, telefone: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Endereço */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
              <div>
                <Label>CEP</Label>
                <Input
                  onChange={(e) => handleCEPChange(e.target.value)}
                  placeholder="00000-000"
                  maxLength={9}
                />
                {loading && (
                  <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
                )}
              </div>
              <div>
                <Label>Endereço</Label>
                <Input
                  value={formData.endereco}
                  onChange={(e) =>
                    setFormData({ ...formData, endereco: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Número</Label>
                <Input
                  value={formData.numero}
                  onChange={(e) =>
                    setFormData({ ...formData, numero: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Bairro</Label>
                <Input
                  value={formData.bairro}
                  onChange={(e) =>
                    setFormData({ ...formData, bairro: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Cidade e Estado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Cidade</Label>
                <Input
                  value={formData.cidade}
                  onChange={(e) =>
                    setFormData({ ...formData, cidade: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Estado</Label>
                <Select
                  value={formData.estado}
                  onValueChange={(v) => {
                    // Obter a região correspondente ao estado selecionado
                    const estado = v as LeadFormData["estado"];
                    const regioes: Record<string, string> = {
                      "AC": "Norte", "AM": "Norte", "AP": "Norte", "PA": "Norte", "RO": "Norte", "RR": "Norte", "TO": "Norte",
                      "AL": "Nordeste", "BA": "Nordeste", "CE": "Nordeste", "MA": "Nordeste", "PB": "Nordeste", 
                      "PE": "Nordeste", "PI": "Nordeste", "RN": "Nordeste", "SE": "Nordeste",
                      "DF": "Centro-Oeste", "GO": "Centro-Oeste", "MS": "Centro-Oeste", "MT": "Centro-Oeste",
                      "ES": "Sudeste", "MG": "Sudeste", "RJ": "Sudeste", "SP": "Sudeste",
                      "PR": "Sul", "RS": "Sul", "SC": "Sul"
                    };
                    
                    const regiao = regioes[estado] || "Sudeste";
                    
                    setFormData({
                      ...formData,
                      estado: estado,
                      regiao: regiao as LeadFormData["regiao"]
                    });
                  }}
                >
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

            {/* Visita realizada */}
            <div>
              <Label>Visita Realizada</Label>
              <Select
                value={formData.visitafeita ? "Sim" : "Não"}
                onValueChange={(v) =>
                  setFormData({ ...formData, visitafeita: v === "Sim" })
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

            {/* Status e Temperatura */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              
              <div>
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) =>
                    setFormData({
                      ...formData,
                      status: v as LeadFormData["status"],
                      // Se mudar para Cliente ou Cancelado, limpa a temperatura
                      temperatura: v === "Cliente" ? null : formData.temperatura
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cliente">Cliente</SelectItem>
                    <SelectItem value="Cancelado">Cancelado</SelectItem>
                    <SelectItem value="Lead">Lead</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.status === "Lead" && (
                <div>
                  <Label>Temperatura</Label>
                  <Select
                    value={formData.temperatura ?? ""}
                    onValueChange={(v) =>
                      setFormData({
                        ...formData,
                        temperatura: v as LeadFormData["temperatura"],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Quente">Quente</SelectItem>
                      <SelectItem value="Morno">Morno</SelectItem>
                      <SelectItem value="Frio">Frio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Detalhes do Status */}
            <div>
              <Label>Detalhes do Status</Label>
              <Input
                value={formData.detalhesStatus}
                onChange={(e) =>
                  setFormData({ ...formData, detalhesStatus: e.target.value })
                }
              />
            </div>

            {/* Em Projeção ✅ */}
            <div className="flex items-center gap-2">
              <Checkbox
                checked={formData.emProjecao}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, emProjecao: checked === true })
                }
              />
              <Label>Lead em Projeção</Label>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Cadastrar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LeadForm;
