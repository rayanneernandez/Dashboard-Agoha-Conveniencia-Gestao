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
  onLeadCreated?: () => void;
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

// 🔹 Atualize a interface Lead se necessário
export interface Lead {
  id?: number;
  nome: string;
  empresa: string;
  email?: string;
  telefone?: string;
  cep?: string;
  endereco?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  status?: string;
  temperatura?: string;
  emProjecao?: boolean;
  detalhesStatus?: string;
  dataVisita?: string;
  regiao?: string;      // ✅ adicionado
  cepstatus?: string;   // ✅ adicionado
}

const LeadForm = ({ onLeadCreated }: LeadFormProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Omit<Lead, "id">>({
    nome: "",
    empresa: "",
    email: "",
    telefone: "",
    cep: "",
    endereco: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
    status: "Ativo",
    temperatura: "Quente",
    emProjecao: false,
    detalhesStatus: "",
    dataVisita: "",
    regiao: "",
    cepstatus: "", // ✅ inicializado
  });

  // 🔎 Buscar endereço pelo CEP
  const handleCEPChange = async (cep: string) => {
    const cleanCEP = cep.replace(/\D/g, "");
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

  // 🚀 Enviar formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome || !formData.empresa || !formData.estado) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    const estadoSelecionado = ESTADOS_BRASILEIROS.find((e) => e.sigla === formData.estado);

    // 🔹 Mapeamento para nomes de colunas do Supabase
    const newLeadDB = {
      nome: formData.nome,
      empresa: formData.empresa,
      email: formData.email,
      telefone: formData.telefone,
      cep: formData.cep,
      endereco: `${formData.endereco} ${formData.numero}`.trim(),
      numero: formData.numero,
      bairro: formData.bairro,
      cidade: formData.cidade,
      estado: formData.estado,
      status: formData.status,
      temperatura: formData.temperatura,
      em_projecao: formData.emProjecao,
      detalhes_status: formData.detalhesStatus,
      data_visita: formData.dataVisita,
      regiao: estadoSelecionado?.regiao || "Sudeste",
      cepstatus: "pendente", // se desejar registrar
    };

    const { error } = await supabase.from("leads").insert([newLeadDB]);

    if (error) {
      console.error("Erro Supabase:", error);
      toast.error(`Erro ao cadastrar lead: ${error.message}`);
      return;
    }

    toast.success("Lead cadastrado com sucesso!");

    // Resetar formulário
    setFormData({
      nome: "",
      empresa: "",
      email: "",
      telefone: "",
      cep: "",
      endereco: "",
      numero: "",
      bairro: "",
      cidade: "",
      estado: "",
      status: "Ativo",
      temperatura: "Quente",
      emProjecao: false,
      detalhesStatus: "",
      dataVisita: "",
      regiao: "",
      cepstatus: "",
    });

    setOpen(false);
    if (onLeadCreated) onLeadCreated();
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
            <DialogDescription>Adicione um novo lead ao seu pipeline de vendas</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ... restante do formulário permanece igual ... */}
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LeadForm;
