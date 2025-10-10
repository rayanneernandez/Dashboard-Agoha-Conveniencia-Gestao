import { toast } from "sonner";

export async function geocodeAddress(endereco: string, numero: string, cidade: string, estado: string) {
  try {
    // Monta o endereço completo
    const enderecoCompleto = `${endereco} ${numero}, ${cidade}, ${estado}, Brasil`;
    
    // Codifica o endereço para URL
    const query = encodeURIComponent(enderecoCompleto);
    
    // Adiciona um atraso para respeitar o limite de requisições do Nominatim
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Faz a requisição para a API do Nominatim
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&countrycodes=br`,
      {
        headers: {
          'User-Agent': 'AgHora Dashboard (contato@aghora.com.br)',
          'Accept-Language': 'pt-BR'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Verifica se encontrou algum resultado
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }

    // Se não encontrou o endereço específico, tenta encontrar a cidade
    const cidadeQuery = encodeURIComponent(`${cidade}, ${estado}, Brasil`);
    const cidadeResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${cidadeQuery}&limit=1&countrycodes=br`,
      {
        headers: {
          'User-Agent': 'AgHora Dashboard (contato@aghora.com.br)',
          'Accept-Language': 'pt-BR'
        }
      }
    );

    if (!cidadeResponse.ok) {
      throw new Error(`HTTP error! status: ${cidadeResponse.status}`);
    }

    const cidadeData = await cidadeResponse.json();

    if (cidadeData && cidadeData.length > 0) {
      return {
        lat: parseFloat(cidadeData[0].lat),
        lng: parseFloat(cidadeData[0].lon)
      };
    }

    // Se não encontrou nem a cidade, usa as coordenadas do estado
    throw new Error('Endereço não encontrado');

  } catch (error) {
    console.error("Erro ao geocodificar endereço:", error);
    // Em caso de erro, retorna null para que o componente possa tratar adequadamente
    return null;
  }
}