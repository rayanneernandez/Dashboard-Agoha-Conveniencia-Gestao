import { useState, useRef, useEffect } from 'react';
import { Lead } from '@/types/lead';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';

interface Message {
  text: string;
  isUser: boolean;
}

interface AIChatProps {
  leads: Lead[];
}

const AIChat = ({ leads }: AIChatProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Adiciona mensagem inicial com exemplos quando o chat é aberto
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          text: "Olá! Sou o assistente da AgHora. Posso te ajudar com informações sobre leads e clientes. Aqui estão alguns exemplos do que você pode perguntar:\n\n" +
                "📍 \"Quantos leads tem em São Paulo?\"\n" +
                "🗺️ \"Quantos leads tem por estado?\"\n" +
                
                "Como posso ajudar você hoje?",
          isUser: false
        }
      ]);
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const processQuestion = (question: string): string => {
    const questionLower = question.toLowerCase();
    
    // Função auxiliar para normalizar texto (remove acentos e caracteres especiais)
    const normalizeText = (text: string) => {
      return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    };

    // Extrai estado da pergunta
    const estados = {
      'acre': 'AC', 'alagoas': 'AL', 'amapa': 'AP', 'amazonas': 'AM',
      'bahia': 'BA', 'ceara': 'CE', 'distrito federal': 'DF',
      'espirito santo': 'ES', 'goias': 'GO', 'maranhao': 'MA',
      'mato grosso': 'MT', 'mato grosso do sul': 'MS', 'minas gerais': 'MG',
      'para': 'PA', 'paraiba': 'PB', 'parana': 'PR', 'pernambuco': 'PE',
      'piaui': 'PI', 'rio de janeiro': 'RJ', 'rio grande do norte': 'RN',
      'rio grande do sul': 'RS', 'rondonia': 'RO', 'roraima': 'RR',
      'santa catarina': 'SC', 'sao paulo': 'SP', 'sergipe': 'SE',
      'tocantins': 'TO'
    };

    // Procura por estado na pergunta
    const estadoMencionado = Object.keys(estados).find(estado => 
      normalizeText(questionLower).includes(normalizeText(estado))
    );

    if (estadoMencionado) {
      const siglaEstado = estados[estadoMencionado];
      const leadsEstado = leads.filter(lead => lead.estado === siglaEstado);
      
      const total = leadsEstado.length;
      const clientes = leadsEstado.filter(lead => lead.status === 'Cliente').length;
      const leadsAtivos = leadsEstado.filter(lead => lead.status === 'Lead').length;
      const cancelados = leadsEstado.filter(lead => lead.status === 'Cancelado').length;
      const quentes = leadsEstado.filter(lead => lead.temperatura === 'Quente').length;
      const mornos = leadsEstado.filter(lead => lead.temperatura === 'Morno').length;
      const frios = leadsEstado.filter(lead => lead.temperatura === 'Frio').length;

      return `No ${estadoMencionado.charAt(0).toUpperCase() + estadoMencionado.slice(1)} temos:\n` +
        `- ${total} registros no total\n` +
        `- ${clientes} clientes ativos\n` +
        `- ${leadsAtivos} leads em prospecção\n` +
        `- ${cancelados} cancelados\n\n` +
        `Temperatura dos leads:\n` +
        `- ${quentes} leads quentes\n` +
        `- ${mornos} leads mornos\n` +
        `- ${frios} leads frios`;
    }

    // Contagem por estado
    if (questionLower.includes('quantos') && questionLower.includes('estado')) {
      const estadosCounts = leads.reduce((acc, lead) => {
        acc[lead.estado] = (acc[lead.estado] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return `Distribuição por estado:\n` +
        Object.entries(estadosCounts)
          .map(([estado, count]) => `- ${estado}: ${count}`)
          .join('\n');
    }

    // Contagem por temperatura
    if (questionLower.includes('temperatura') || questionLower.includes('quentes')) {
      const quentes = leads.filter(lead => lead.temperatura === 'Quente').length;
      const mornos = leads.filter(lead => lead.temperatura === 'Morno').length;
      const frios = leads.filter(lead => lead.temperatura === 'Frio').length;

      return `Distribuição por temperatura:\n` +
        `- Leads Quentes: ${quentes}\n` +
        `- Leads Mornos: ${mornos}\n` +
        `- Leads Frios: ${frios}`;
    }

    // Contagem por status
    if (questionLower.includes('status') || questionLower.includes('total')) {
      const clientes = leads.filter(lead => lead.status === 'Cliente').length;
      const leadsAtivos = leads.filter(lead => lead.status === 'Lead').length;
      const cancelados = leads.filter(lead => lead.status === 'Cancelado').length;

      return `Status geral:\n` +
        `- Total de registros: ${leads.length}\n` +
        `- Clientes ativos: ${clientes}\n` +
        `- Leads em prospecção: ${leadsAtivos}\n` +
        `- Cancelados: ${cancelados}`;
    }

    return "Desculpe, não entendi sua pergunta. Você pode perguntar sobre:\n" +
      "- Quantidade de leads/clientes em uma cidade específica\n" +
      "- Distribuição por estado\n" +
      "- Distribuição por temperatura\n" +
      "- Status geral dos leads";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { text: userMessage, isUser: true }]);
    setInput('');
    setIsLoading(true);

    // Simula um pequeno delay para parecer mais natural
    setTimeout(() => {
      const response = processQuestion(userMessage);
      setMessages(prev => [...prev, { text: response, isUser: false }]);
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          className="h-12 w-12 rounded-full bg-[#660629] hover:bg-[#4a0420] text-white shadow-lg"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      ) : (
        <div className="bg-white rounded-lg shadow-xl w-80 h-96 flex flex-col">
          {/* Header */}
          <div className="p-4 bg-[#660629] text-white rounded-t-lg flex justify-between items-center">
            <span className="font-semibold">Assistente AgHora</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 text-white hover:text-white/80"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-2 ${
                    message.isUser
                      ? 'bg-[#660629] text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <pre className="whitespace-pre-wrap font-sans text-sm">
                    {message.text}
                  </pre>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-2">
                  <Loader2 className="h-5 w-5 animate-spin text-[#660629]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Digite sua pergunta..."
                className="flex-1"
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading}
                className="bg-[#660629] hover:bg-[#4a0420] text-white"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AIChat;