import { useState, useEffect } from "react";
import { Lead, ESTADOS_BRASILEIROS, EditableLead } from "@/types/lead";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Edit } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

interface EditLeadDialogProps {
  lead: Lead;
  onEditLead: (id: string, updatedLead: Omit<Lead, "id" | "dataultimaatualizacao">) => void;
}

const BUCKET_NAME = "leads-media";
const MAX_FILE_SIZE_MB = 50;

const EditLeadDialog = ({ lead, onEditLead }: EditLeadDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<EditableLead>({
    nome: lead.nome,
    razaosocial: lead.razaosocial,
    email: lead.email,
    telefone: lead.telefone,
    endereco: lead.endereco,
    numero: lead.numero,
    bairro: lead.bairro,
    cidade: lead.cidade,
    estado: lead.estado,
    cep: lead.cep,
    regiao: lead.regiao,
    status: lead.status,
    temperatura: lead.temperatura,
    detalhesStatus: lead.detalhesStatus,
    emProjecao: lead.emProjecao,
    visitafeita: lead.visitafeita,
    midias: Array.isArray(lead.midias) 
      ? lead.midias.filter((m): m is string => typeof m === "string")
      : [],
  });
  const [previews, setPreviews] = useState<{ url: string; file?: File }[]>([]);

  useEffect(() => {
    console.log("🔄 Lead recebido no EditLeadDialog:", lead);
    
    setFormData({
      nome: lead.nome,
      razaosocial: lead.razaosocial,
      email: lead.email,
      telefone: lead.telefone,
      endereco: lead.endereco,
      numero: lead.numero,
      bairro: lead.bairro,
      cidade: lead.cidade,
      estado: lead.estado,
      cep: lead.cep,
      regiao: lead.regiao,
      status: lead.status,
      temperatura: lead.temperatura,
      detalhesStatus: lead.detalhesStatus,
      emProjecao: lead.emProjecao,
      visitafeita: lead.visitafeita,
      midias: Array.isArray(lead.midias) 
        ? lead.midias.filter((m): m is string => typeof m === "string")
        : [],
    });
    
    const existingPreviews = (lead.midias || [])
      .filter((url): url is string => typeof url === 'string')
      .map(url => ({ url }));
    setPreviews(existingPreviews);
    
    console.log("📝 FormData inicializado:", formData);
  }, [lead]);

  const handleInputChange = <K extends keyof EditableLead>(field: K, value: EditableLead[K]) => {
    console.log(`🔄 Campo alterado: ${String(field)} = ${value}`);
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const uploadedUrls: string[] = [];

    for (const file of files) {
      if (file.size / 1024 / 1024 > MAX_FILE_SIZE_MB) {
        toast.error(`Arquivo ${file.name} excede ${MAX_FILE_SIZE_MB}MB.`);
        return;
      }

      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
      const filePath = `${timestamp}_${safeName}`;
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, { upsert: true, contentType: file.type });

      if (error) throw error;

      const { data: publicData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);
      if (!publicData?.publicUrl) throw new Error("Não foi possível gerar URL pública da mídia.");

      uploadedUrls.push(publicData.publicUrl);
    }

    const currentMidias = formData.midias || [];
    const allMidias = [...currentMidias.filter((m): m is string => typeof m === 'string'), ...uploadedUrls];
    
    setFormData(prev => ({ 
      ...prev, 
      midias: allMidias
    }));
    setPreviews(prev => [...prev, ...uploadedUrls.map(url => ({ url }))]);
  };

  const removeMidia = (index: number) => {
    setPreviews(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => {
      const currentMidias = prev.midias || [];
      const filteredMidias = currentMidias.filter((m): m is string => typeof m === 'string');
      return {
        ...prev,
        midias: filteredMidias.filter((_, i) => i !== index),
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("🔄 Iniciando edição do lead no dialog:", { id: lead.id, formData });
      console.log("🌡️ Temperatura no formData antes do envio:", formData.temperatura);
      
      await onEditLead(lead.id, formData);
      
      console.log("✅ Edição concluída com sucesso no dialog");
      toast.success("Lead atualizado com sucesso!");
      setOpen(false);
    } catch (err: any) {
      console.error("❌ Erro na edição do lead no dialog:", err);
      toast.error(err.message || "Erro ao atualizar lead");
    } finally {
      setLoading(false);
    }
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
              <Label>Nome</Label>
              <Input value={formData.nome} onChange={e => handleInputChange("nome", e.target.value)} />
            </div>
            <div>
              <Label>Razão Social</Label>
              <Input value={formData.razaosocial} onChange={e => handleInputChange("razaosocial", e.target.value)} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={formData.email} onChange={e => handleInputChange("email", e.target.value)} />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={formData.telefone} onChange={e => handleInputChange("telefone", e.target.value)} />
            </div>
            <div>
              <Label>CEP</Label>
              <Input value={formData.cep || ""} onChange={e => handleInputChange("cep", e.target.value)} />
            </div>
            <div>
              <Label>Endereço</Label>
              <Input value={formData.endereco} onChange={e => handleInputChange("endereco", e.target.value)} />
            </div>
            <div>
              <Label>Número</Label>
              <Input value={formData.numero} onChange={e => handleInputChange("numero", e.target.value)} />
            </div>
            <div>
              <Label>Bairro</Label>
              <Input value={formData.bairro} onChange={e => handleInputChange("bairro", e.target.value)} />
            </div>
            <div>
              <Label>Cidade</Label>
              <Input value={formData.cidade} onChange={e => handleInputChange("cidade", e.target.value)} />
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={formData.estado} onValueChange={(value) => handleInputChange("estado", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ESTADOS_BRASILEIROS.map((estado) => (
                    <SelectItem key={estado.sigla} value={estado.sigla}>
                      {estado.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value: "Ativo" | "Inativo" | "Cliente" | "Cancelado" | "Lead") => handleInputChange("status", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Lead">Lead</SelectItem>
                  <SelectItem value="Cliente">Cliente</SelectItem>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Temperatura</Label>
              <Select value={formData.temperatura || ""} onValueChange={(value: "Quente" | "Morno" | "Frio") => handleInputChange("temperatura", value)}>
                <SelectTrigger><SelectValue placeholder="Selecione a temperatura" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Quente">Quente</SelectItem>
                  <SelectItem value="Morno">Morno</SelectItem>
                  <SelectItem value="Frio">Frio</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Visita Realizada</Label>
            <Select value={formData.visitafeita} onValueChange={(value: "Sim" | "Não") => handleInputChange("visitafeita", value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Não">Não</SelectItem>
                <SelectItem value="Sim">Sim</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Descrição Detalhada</Label>
            <textarea 
              className="w-full p-2 border border-gray-300 rounded-md resize-none"
              rows={3}
              value={formData.detalhesStatus}
              onChange={e => handleInputChange("detalhesStatus", e.target.value)}
              placeholder="Adicione detalhes sobre o lead..."
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="emProjecao"
              checked={formData.emProjecao}
              onCheckedChange={(checked) => handleInputChange("emProjecao", !!checked)}
            />
            <Label htmlFor="emProjecao">Em Projeção</Label>
          </div>

          <div className="space-y-2">
            <Label>Mídias (opcional)</Label>
            <input type="file" multiple onChange={handleFileUpload} />
            <div className="flex gap-2 flex-wrap mt-2">
              {previews.map((p, i) => (
                <div key={i} className="relative">
                  <img src={p.url} className="w-20 h-20 object-cover rounded" />
                  <button type="button" onClick={() => removeMidia(i)} className="absolute top-0 right-0 bg-red-500 text-white rounded-full px-1">x</button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Salvar Alterações"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditLeadDialog;
