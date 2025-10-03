import { toast } from "sonner";

export async function geocodeAddress(endereco: string, numero: string, cidade: string, estado: string, index: number = 0) {
  try {
    // Monta o endereço completo
    const enderecoCompleto = `${endereco} ${numero}, ${cidade}, ${estado}, Brasil`;
    

    
    // Por enquanto, vamos retornar coordenadas aproximadas para cada estado
    const coordenadasPorEstado: { [key: string]: { lat: number; lng: number } } = {
      'AC': { lat: -9.0238, lng: -70.812 },
      'AL': { lat: -9.5713, lng: -36.782 },
      'AP': { lat: 0.902, lng: -52.003 },
      'AM': { lat: -3.4168, lng: -65.8561 },
      'BA': { lat: -12.9718, lng: -38.5011 },
      'CE': { lat: -3.7172, lng: -38.5433 },
      'DF': { lat: -15.7801, lng: -47.9292 },
      'ES': { lat: -20.2976, lng: -40.2958 },
      'GO': { lat: -16.6864, lng: -49.2643 },
      'MA': { lat: -2.5307, lng: -44.2987 },
      'MT': { lat: -15.601, lng: -56.0974 },
      'MS': { lat: -20.4697, lng: -54.6201 },
      'MG': { lat: -19.9167, lng: -43.9345 },
      'PA': { lat: -1.4554, lng: -48.4898 },
      'PB': { lat: -7.115, lng: -34.8631 },
      'PR': { lat: -25.4195, lng: -49.2646 },
      'PE': { lat: -8.0476, lng: -34.8770 },
      'PI': { lat: -5.0892, lng: -42.8019 },
      'RJ': { lat: -22.9068, lng: -43.1729 },
      'RN': { lat: -5.7945, lng: -35.2120 },
      'RS': { lat: -30.0346, lng: -51.2177 },
      'RO': { lat: -8.7619, lng: -63.9039 },
      'RR': { lat: 2.8235, lng: -60.6758 },
      'SC': { lat: -27.5945, lng: -48.5477 },
      'SP': { lat: -23.5505, lng: -46.6333 },
      'SE': { lat: -10.9091, lng: -37.0677 },
      'TO': { lat: -10.1753, lng: -48.2982 }
    };

    // Pega as coordenadas base do estado
    const baseCoords = coordenadasPorEstado[estado] || { lat: -15.7801, lng: -47.9292 };

    // Cria uma variação baseada no índice do lead
    // Isso criará um padrão em espiral ao redor do ponto central
    const angle = index * (Math.PI / 4); // 45 graus entre cada ponto
    const radius = 0.02 * (Math.floor(index / 8) + 1); // Aumenta o raio a cada 8 pontos
    
    const varLat = radius * Math.cos(angle);
    const varLng = radius * Math.sin(angle);

    // Retorna as coordenadas com a variação
    return {
      lat: baseCoords.lat + varLat,
      lng: baseCoords.lng + varLng
    };
  } catch (error) {
    console.error("Erro ao geocodificar endereço:", error);
    // Retorna coordenadas do centro do Brasil em caso de erro
    return { lat: -15.7801, lng: -47.9292 };
  }
}