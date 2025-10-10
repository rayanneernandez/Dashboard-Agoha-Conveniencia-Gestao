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
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, UserPlus, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { LeadFormData, ESTADOS_BRASILEIROS } from "@/types/lead";
import { supabase } from "@/lib/supabaseClient";

interface LeadFormProps {
  onAddLead?: (leadData: LeadFormData) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface ViaCEPResponse {
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

const MAX_FILE_SIZE_MB = 50;
const BUCKET_NAME = 'leads-media'; 

const LeadForm = ({ onAddLead, open, onOpenChange }: LeadFormProps) => {
  const [loading, setLoading] = useState(false);
  const [previews, setPreviews] = useState<{ url: string; type: string; file: File }[]>([]);

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
    status: "Lead",
    temperatura: null,
    emProjecao: false,
    detalhesStatus: "",
    visitafeita: "Não",
    midias: [],
  });

  const handleCEPChange = async (cep: string) => {
    const clean = cep.replace(/\D/g, "");
    if (clean.length === 8) {
      setLoading(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
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

  const handleMidiasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    for (let file of files) {
      if (file.size / 1024 / 1024 > MAX_FILE_SIZE_MB) {
        toast.error(`Arquivo ${file.name} excede ${MAX_FILE_SIZE_MB}MB.`);
        return;
      }
    }

    setFormData(prev => ({ ...prev, midias: [...prev.midias, ...files] }));

    const newPreviews = files.map(file => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith("video/") ? "video" : "image",
      file
    }));

    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeMidia = (index: number) => {
    setFormData(prev => ({
      ...prev,
      midias: prev.midias.filter((_, i) => i !== index),
    }));
    setPreviews(prev => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.midias.length === 0) {
      toast.error("Adicione pelo menos uma mídia.");
      return;
    }

    setLoading(true);

    try {
      const uploadedUrls: string[] = [];

      for (let file of formData.midias) {
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
        const filePath = `${timestamp}_${safeName}`;
      
        // Tentando fazer o upload
        const { data, error } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, file, {
            upsert: true,
            contentType: file.type,
            cacheControl: '3600'
          });
      
        if (error) {
          console.error('Erro detalhado:', error);
          throw new Error(`Erro no upload da mídia ${file.name}: ${error.message}`);
        }
      
        if (!data?.path) throw new Error(`Upload retornou path inválido para ${file.name}`);
      
        const { data: publicData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(data.path);
      
        if (!publicData?.publicUrl) throw new Error(`Não foi possível gerar URL pública para ${file.name}`);
        uploadedUrls.push(publicData.publicUrl);
      }

      const leadToSave: Omit<LeadFormData, "midias"> & { midias: string[]; dataultimaatualizacao: string } = {
        ...formData,
        midias: uploadedUrls,
        dataultimaatualizacao: new Date().toISOString(),
      };

      // Inserir o lead e obter o resultado diretamente
      const { data: newLead, error } = await supabase
        .from("leads")
        .insert([leadToSave])
        .select()
        .single();

      if (error) throw error;
      if (newLead) onAddLead?.(newLead);

      toast.success("Lead cadastrado com sucesso!");

      // Reset form
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
        status: "Lead",
        temperatura: null,
        emProjecao: false,
        detalhesStatus: "",
        visitafeita: "Não",
        midias: [],
      });

      previews.forEach(p => URL.revokeObjectURL(p.url));
      setPreviews([]);
      onOpenChange?.(false);

    } catch (err: any) {
      console.error('Erro completo:', err);
      toast.error(err.message || "Erro ao cadastrar lead.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" /> Cadastrar Novo Lead
          </DialogTitle>
          <DialogDescription>
            Preencha as informações abaixo para registrar um novo lead.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dados básicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nome</Label>
              <Input value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} required />
            </div>
            <div>
              <Label>Razão Social</Label>
              <Input value={formData.razaosocial} onChange={e => setFormData({...formData, razaosocial: e.target.value})} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} />
            </div>
          </div>

          {/* Endereço */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>CEP</Label>
              <Input onBlur={e => handleCEPChange(e.target.value)} placeholder="00000-000" />
            </div>
            <div>
              <Label>Endereço</Label>
              <Input value={formData.endereco} onChange={e => setFormData({...formData, endereco: e.target.value})} />
            </div>
            <div>
              <Label>Número</Label>
              <Input value={formData.numero} onChange={e => setFormData({...formData, numero: e.target.value})} />
            </div>
            <div>
              <Label>Bairro</Label>
              <Input value={formData.bairro} onChange={e => setFormData({...formData, bairro: e.target.value})} />
            </div>
            <div>
              <Label>Cidade</Label>
              <Input value={formData.cidade} onChange={e => setFormData({...formData, cidade: e.target.value})} />
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={formData.estado} onValueChange={v => setFormData({...formData, estado: v as LeadFormData["estado"]})}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS_BRASILEIROS.map(e => <SelectItem key={e.sigla} value={e.sigla}>{e.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status, Projeção e Visita */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v as LeadFormData["status"]})}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Lead">Lead</SelectItem>
                  <SelectItem value="Cliente">Cliente</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {formData.status === "Lead" && (
              <div>
                <Label>Temperatura</Label>
                <Select 
                  value={formData.temperatura ?? ""} 
                  onValueChange={v => setFormData({...formData, temperatura: v as "Quente" | "Morno" | "Frio"})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a temperatura" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Quente">Quente</SelectItem>
                    <SelectItem value="Morno">Morno</SelectItem>
                    <SelectItem value="Frio">Frio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Novo campo de Visita */}
            <div>
              <Label>Visita Realizada</Label>
              <Select 
                value={formData.visitafeita} 
                onValueChange={v => setFormData({...formData, visitafeita: v as "Sim" | "Não"})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Visita foi realizada?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sim">Sim</SelectItem>
                  <SelectItem value="Não">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="col-span-2">
              <Label>Descrição Detalhada</Label>
              <Textarea 
                value={formData.detalhesStatus} 
                onChange={e => setFormData({...formData, detalhesStatus: e.target.value})}
                placeholder="Adicione detalhes sobre o lead..."
                className="h-24"
              />
            </div>

            <div className="col-span-2 flex items-center gap-2">
              <Checkbox checked={formData.emProjecao} onCheckedChange={v => setFormData({...formData, emProjecao: !!v})} />
              <Label>Em Projeção</Label>
            </div>
          </div>

          {/* Upload mídias */}
          <div>
            <Label>Mídias (imagens e vídeos)</Label>
            <div className="flex items-center gap-3">
              <Input type="file" accept="image/*,video/*" onChange={handleMidiasChange} multiple />
              <ImageIcon className="h-5 w-5 text-[#660629]" />
            </div>
            {previews.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-4">
                {previews.map((p, i) => (
                  <div key={i} className="relative">
                    {p.type === "image" ? (
                      <img src={p.url} alt={`Mídia ${i+1}`} className="w-32 h-32 object-cover rounded-lg border" />
                    ) : (
                      <video src={p.url} className="w-32 h-32 object-cover rounded-lg border" controls />
                    )}
                    <Button type="button" variant="destructive" size="sm" className="absolute top-2 right-2" onClick={() => removeMidia(i)}>×</Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Cadastrar"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LeadForm;
