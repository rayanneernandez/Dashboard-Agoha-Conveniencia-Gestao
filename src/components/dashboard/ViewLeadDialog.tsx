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

interface ViewLeadDialogProps {
  lead: Lead;
}

const ViewLeadDialog: React.FC<ViewLeadDialogProps> = ({ lead }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
            <Button
            size="sm"
            className="bg-pink-700 hover:bg-pink 600 text-white shadow-sm"
            >
            <Eye className="h-4 w-4" />
            </Button>

      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Detalhes do Lead</DialogTitle>
          <DialogDescription>
            Veja todas as informações deste lead.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <p><strong>Nome:</strong> {lead.nome}</p>
          <p><strong>Razão Social:</strong> {lead.razaosocial}</p>
          <p><strong>Email:</strong> {lead.email}</p>
          <p><strong>Telefone:</strong> {lead.telefone}</p>
          <p><strong>Endereço:</strong> {lead.endereco} {lead.numero}</p>
          <p><strong>Bairro:</strong> {lead.bairro}</p>
          <p><strong>Cidade:</strong> {lead.cidade}</p>
          <p><strong>Estado:</strong> {lead.estado}</p>
          <p><strong>Status:</strong> {lead.status}</p>
          <p><strong>Temperatura:</strong> {lead.temperatura}</p>
          <p><strong>Detalhes Status:</strong> {lead.detalhesStatus}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewLeadDialog;
