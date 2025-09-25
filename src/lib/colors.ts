export const brandColors = {
  primary: '#A3023D',    // Vermelho escuro principal
  secondary: '#EB1E61',  // Rosa
  success: '#00B359',    // Verde para leads ativos
  warning: '#FF6900',    // Laranja para leads quentes
  danger: '#A3023D',     // Vermelho para inativos
  info: '#6B7280',       // Cinza para leads frios
  white: '#FFFFFF',
  background: '#F8F9FA'
};

export const chartColors = {
  bar: brandColors.primary,
  pie: [
    brandColors.primary,
    brandColors.secondary,
    brandColors.warning,
    brandColors.info
  ]
};

export const cardStyles = {
  total: {
    icon: 'text-pink-600',
    bg: 'bg-white'
  },
  active: {
    icon: 'text-green-600',
    bg: 'bg-white'
  },
  inactive: {
    icon: 'text-red-600',
    bg: 'bg-white'
  },
  warning: {
    icon: 'text-orange-600',
    bg: 'bg-white'
  },
  cold: {
    icon: 'text-gray-600',
    bg: 'bg-white'
  },
  projection: {
    icon: 'text-green-600',
    bg: 'bg-white'
  }
};
export const gradients = {
  header: `linear-gradient(to right, ${brandColors.background}, #6495ED)`, // Gradiente azul para o header
  card: {
    total: `linear-gradient(to right, #EB1E61, #FF6900)`,      // Rosa para laranja
    active: `linear-gradient(to right, #008E49, #00B359)`,     // Verde
    inactive: `linear-gradient(to right, #A3023D, #EB1E61)`,   // Vermelho para rosa
    warning: `linear-gradient(to right, #FF6900, #FFB347)`,    // Laranja
    cold: `linear-gradient(to right, #9370DB, #B19CD9)`,       // Roxo
    projection: `linear-gradient(to right, #008E49, #00B359)`   // Verde
  }
};