import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { Lead } from "@/types/lead";
import { useState } from "react";
import { toast } from "sonner";

interface ViewLeadDialogProps {
  lead: Lead;
}

const ViewLeadDialog: React.FC<ViewLeadDialogProps> = ({ lead }) => {
  const [selectedMidiaIndex, setSelectedMidiaIndex] = useState<number | null>(0); // Inicializa com 0 para mostrar a primeira mídia

  const midias = lead.midias || [];

  const getMidiaType = (midia: string | File) => {
    if (midia instanceof File) {
      return midia.type.startsWith('video/') ? 'video' : 'image';
    }
    // Para URLs, verifica a extensão do arquivo
    if (typeof midia === 'string') {
      const extension = midia.split('.').pop()?.toLowerCase();
      if (extension) {
        return ['mp4', 'webm', 'ogg', 'mkv'].includes(extension) ? 'video' : 'image';
      }
    }
    return 'image';
  };

  const getMidiaUrl = (midia: File | string) => {
    if (midia instanceof File) {
      return URL.createObjectURL(midia);
    }
    return midia;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Lead</DialogTitle>
          <DialogDescription>
            Informações completas do lead selecionado.
          </DialogDescription>
        </DialogHeader>

        {/* Visualização de Mídias */}
        <div className="space-y-4">
          <h3 className="font-semibold">Mídias</h3>
          {midias.length > 0 ? (
            <>
              {/* Mídia selecionada em destaque */}
              <div className="w-full h-96 flex justify-center items-center bg-black/5 rounded-lg overflow-hidden">
                {selectedMidiaIndex !== null && (
                  getMidiaType(midias[selectedMidiaIndex]) === 'video' ? (
                    <video
                      src={getMidiaUrl(midias[selectedMidiaIndex])}
                      controls
                      className="max-h-full w-full"
                      preload="metadata"
                      controlsList="nodownload"
                    >
                      <source src={getMidiaUrl(midias[selectedMidiaIndex])} type="video/mp4" />
                      <source src={getMidiaUrl(midias[selectedMidiaIndex])} type="video/webm" />
                      Seu navegador não suporta a reprodução de vídeos.
                    </video>
                  ) : (
                    <img
                      src={getMidiaUrl(midias[selectedMidiaIndex])}
                      alt={`Mídia ${selectedMidiaIndex + 1}`}
                      className="max-h-full object-contain"
                    />
                  )
                )}
              </div>

              {/* Miniaturas */}
              <div className="grid grid-cols-6 gap-2">
                {midias.map((midia, i) => (
                  <div
                    key={i}
                    className={`cursor-pointer border-2 rounded-lg overflow-hidden ${
                      selectedMidiaIndex === i ? "border-blue-500" : "border-transparent"
                    }`}
                    onClick={() => setSelectedMidiaIndex(i)}
                  >
                    {getMidiaType(midia) === 'video' ? (
                      <div className="relative w-full h-20">
                        <video
                          src={getMidiaUrl(midia)}
                          className="w-full h-20 object-cover"
                          preload="metadata"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <span className="text-white text-2xl">▶</span>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={getMidiaUrl(midia)}
                        alt={`Mídia ${i + 1}`}
                        className="w-full h-20 object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">Nenhuma mídia disponível.</p>
          )}
        </div>

        {/* Detalhes do Lead */}
        <div className="space-y-2">
          <p><strong>Nome:</strong> {lead.nome}</p>
          <p><strong>Razão Social:</strong> {lead.razaosocial}</p>
          <p><strong>Email:</strong> {lead.email}</p>
          <p><strong>Telefone:</strong> {lead.telefone}</p>
          <p><strong>Endereço:</strong> {lead.endereco}, {lead.numero}</p>
          <p><strong>Bairro:</strong> {lead.bairro}</p>
          <p><strong>Cidade:</strong> {lead.cidade}</p>
          <p><strong>Estado:</strong> {lead.estado}</p>
          <p><strong>Status:</strong> {lead.status}</p>
          <p><strong>Temperatura:</strong> {lead.temperatura || "N/A"}</p>
          <p><strong>Em Projeção:</strong> {lead.emProjecao ? "Sim" : "Não"}</p>
          <p><strong>Visita Feita:</strong> {lead.visitafeita}</p>
          {lead.detalhesStatus && (
            <p><strong>Detalhes do Status:</strong> {lead.detalhesStatus}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewLeadDialog;
