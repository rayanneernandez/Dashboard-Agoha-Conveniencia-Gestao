export interface Lead {
  id: string;
  nome: string;
  razaosocial: string;
  email: string;
  telefone: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  regiao: 'Norte' | 'Nordeste' | 'Centro-Oeste' | 'Sudeste' | 'Sul';
  status: 'Ativo' | 'Inativo' | 'Cliente' | 'Cancelado' | 'Lead';
  temperatura: 'Quente' | 'Morno' | 'Frio' | null;
  emProjecao: boolean;
  detalhesStatus: string;
  visitafeita: 'Sim' | 'Não'; 
  dataultimaatualizacao?: string;
  midias?: (File | string)[]; // Alterado para aceitar tanto File quanto string
  coordenadas?: { lat: number; lng: number };
}

export interface LeadFormData {
  nome: string;
  razaosocial: string;
  email: string;
  telefone: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: Lead["estado"];
  regiao: Lead["regiao"];
  status: Lead["status"];
  temperatura: Lead["temperatura"];
  emProjecao: boolean;
  detalhesStatus: string;
  visitafeita: 'Sim' | 'Não'; 
  midias: (File | null)[]; // Alterado de imagem para midias
  coordenadas?: { lat: number; lng: number };
}

// Atualizar a função mapLeadToDB também
export const mapLeadToDB = (data: LeadFormData & { dataultimaatualizacao?: string }) => ({
  ...data,
  midias: data.midias.filter((m): m is File => m !== null), // Filtra os nulos
  dataultimaatualizacao: new Date().toISOString(),
  temperatura: data.status === "Lead" ? data.temperatura : null,
  emProjecao: !!data.emProjecao,
});

export interface DashboardStats {
  totalLeads: number;
  leadsAtivos: number;
  leadsInativos: number;
  leadsQuentes: number;
  leadsFrios: number;
  leadsEmProjecao: number;
  distribuicaoPorRegiao: { Norte: number; Nordeste: number; 'Centro-Oeste': number; Sudeste: number; Sul: number; };
}

export const ESTADOS_BRASILEIROS = [
  { sigla: 'AC', nome: 'Acre', regiao: 'Norte' as const },
  { sigla: 'AL', nome: 'Alagoas', regiao: 'Nordeste' as const },
  { sigla: 'AP', nome: 'Amapá', regiao: 'Norte' as const },
  { sigla: 'AM', nome: 'Amazonas', regiao: 'Norte' as const },
  { sigla: 'BA', nome: 'Bahia', regiao: 'Nordeste' as const },
  { sigla: 'CE', nome: 'Ceará', regiao: 'Nordeste' as const },
  { sigla: 'DF', nome: 'Distrito Federal', regiao: 'Centro-Oeste' as const },
  { sigla: 'ES', nome: 'Espírito Santo', regiao: 'Sudeste' as const },
  { sigla: 'GO', nome: 'Goiás', regiao: 'Centro-Oeste' as const },
  { sigla: 'MA', nome: 'Maranhão', regiao: 'Nordeste' as const },
  { sigla: 'MT', nome: 'Mato Grosso', regiao: 'Centro-Oeste' as const },
  { sigla: 'MS', nome: 'Mato Grosso do Sul', regiao: 'Centro-Oeste' as const },
  { sigla: 'MG', nome: 'Minas Gerais', regiao: 'Sudeste' as const },
  { sigla: 'PA', nome: 'Pará', regiao: 'Norte' as const },
  { sigla: 'PB', nome: 'Paraíba', regiao: 'Nordeste' as const },
  { sigla: 'PR', nome: 'Paraná', regiao: 'Sul' as const },
  { sigla: 'PE', nome: 'Pernambuco', regiao: 'Nordeste' as const },
  { sigla: 'PI', nome: 'Piauí', regiao: 'Nordeste' as const },
  { sigla: 'RJ', nome: 'Rio de Janeiro', regiao: 'Sudeste' as const },
  { sigla: 'RN', nome: 'Rio Grande do Norte', regiao: 'Nordeste' as const },
  { sigla: 'RS', nome: 'Rio Grande do Sul', regiao: 'Sul' as const },
  { sigla: 'RO', nome: 'Rondônia', regiao: 'Norte' as const },
  { sigla: 'RR', nome: 'Roraima', regiao: 'Norte' as const },
  { sigla: 'SC', nome: 'Santa Catarina', regiao: 'Sul' as const },
  { sigla: 'SP', nome: 'São Paulo', regiao: 'Sudeste' as const },
  { sigla: 'SE', nome: 'Sergipe', regiao: 'Nordeste' as const },
  { sigla: 'TO', nome: 'Tocantins', regiao: 'Norte' as const },
] as const;
