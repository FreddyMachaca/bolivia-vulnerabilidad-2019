export const MAPEO_DEPARTAMENTOS = {
  'Chuquisaca': 'Chuquisaca',
  'Sucre': 'Chuquisaca',
  'La Paz': 'La Paz',
  'Cochabamba': 'Cochabamba', 
  'Oruro': 'Oruro',
  'Potosí': 'Potosí',
  'Tarija': 'Tarija',
  'Santa Cruz': 'Santa Cruz',
  'Beni': 'Beni',
  'Trinidad': 'Beni',
  'Pando': 'Pando'
}

export const normalizarNombreDepartamento = (nombre) => {
  return MAPEO_DEPARTAMENTOS[nombre] || nombre
}

export const UMBRALES = {
  VULNERABILIDAD: {
    MUY_ALTO: 0.15,
    ALTO: 0.05,
    MEDIO: 0.0,
    BAJO: -0.13
  },
  
  INGRESO_PER_CAPITA: {
    ALTO: 780,
    MEDIO: 650,
    BAJO: 550
  },
  
  ALFABETIZACION: {
    ALTO: 0.88,
    MEDIO: 0.86,
    BAJO: 0.82
  }
}

export const COLORES = {
  VULNERABILIDAD: {
    MUY_ALTO: '#DC2626',
    ALTO: '#EF4444', 
    MEDIO: '#F59E0B',
    BAJO: '#10B981'
  },
  
  INGRESO: {
    ALTO: '#10B981',
    MEDIO: '#F59E0B', 
    BAJO: '#EF4444'
  },
  
  EDUCACION: {
    ALTO: '#10B981',
    MEDIO: '#F59E0B',
    BAJO: '#EF4444'
  }
}

export const CLASES_CSS = {
  VULNERABILIDAD: {
    MUY_ALTO: 'text-red-800 bg-red-100',
    ALTO: 'text-red-600 bg-red-50',
    MEDIO: 'text-yellow-600 bg-yellow-50',
    BAJO: 'text-green-600 bg-green-50'
  },
  
  ESTADO_DEPARTAMENTO: {
    CRITICO: 'px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs',
    ALTO_RIESGO: 'px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs',
    MODERADO: 'px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs',
    ESTABLE: 'px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs'
  }
}

export const obtenerNivelVulnerabilidad = (valor) => {
  if (valor >= UMBRALES.VULNERABILIDAD.MUY_ALTO) {
    return { 
      nivel: 'Muy Alto', 
      color: CLASES_CSS.VULNERABILIDAD.MUY_ALTO,
      categoria: 'MUY_ALTO'
    }
  }
  if (valor >= UMBRALES.VULNERABILIDAD.ALTO) {
    return { 
      nivel: 'Alto', 
      color: CLASES_CSS.VULNERABILIDAD.ALTO,
      categoria: 'ALTO'
    }
  }
  if (valor >= UMBRALES.VULNERABILIDAD.MEDIO) {
    return { 
      nivel: 'Medio', 
      color: CLASES_CSS.VULNERABILIDAD.MEDIO,
      categoria: 'MEDIO'
    }
  }
  return { 
    nivel: 'Bajo', 
    color: CLASES_CSS.VULNERABILIDAD.BAJO,
    categoria: 'BAJO'
  }
}

export const obtenerEstadoDepartamento = (vulnerabilidad) => {
  if (vulnerabilidad >= UMBRALES.VULNERABILIDAD.MUY_ALTO) {
    return { texto: 'Crítico', clase: CLASES_CSS.ESTADO_DEPARTAMENTO.CRITICO }
  }
  if (vulnerabilidad >= UMBRALES.VULNERABILIDAD.ALTO) {
    return { texto: 'Alto Riesgo', clase: CLASES_CSS.ESTADO_DEPARTAMENTO.ALTO_RIESGO }
  }
  if (vulnerabilidad >= UMBRALES.VULNERABILIDAD.MEDIO) {
    return { texto: 'Moderado', clase: CLASES_CSS.ESTADO_DEPARTAMENTO.MODERADO }
  }
  return { texto: 'Estable', clase: CLASES_CSS.ESTADO_DEPARTAMENTO.ESTABLE }
}

export const obtenerColorVulnerabilidad = (valor) => {
  if (valor >= UMBRALES.VULNERABILIDAD.MUY_ALTO) return 'text-red-600 bg-red-100'
  if (valor >= UMBRALES.VULNERABILIDAD.ALTO) return 'text-orange-600 bg-orange-100'  
  if (valor >= UMBRALES.VULNERABILIDAD.MEDIO) return 'text-yellow-600 bg-yellow-100'
  return 'text-green-600 bg-green-100'
}

export const obtenerColorMapa = (value, tipo) => {
  switch (tipo) {
    case 'vulnerabilidad':
      if (value >= UMBRALES.VULNERABILIDAD.MUY_ALTO) return COLORES.VULNERABILIDAD.MUY_ALTO
      if (value >= UMBRALES.VULNERABILIDAD.ALTO) return COLORES.VULNERABILIDAD.ALTO
      if (value >= UMBRALES.VULNERABILIDAD.MEDIO) return COLORES.VULNERABILIDAD.MEDIO
      return COLORES.VULNERABILIDAD.BAJO
      
    case 'ingreso_per_capita':
      if (value >= UMBRALES.INGRESO_PER_CAPITA.ALTO) return COLORES.INGRESO.ALTO
      if (value >= UMBRALES.INGRESO_PER_CAPITA.MEDIO) return COLORES.INGRESO.MEDIO
      return COLORES.INGRESO.BAJO
      
    case 'alfabetizacion':
      if (value >= UMBRALES.ALFABETIZACION.ALTO) return COLORES.EDUCACION.ALTO
      if (value >= UMBRALES.ALFABETIZACION.MEDIO) return COLORES.EDUCACION.MEDIO
      return COLORES.EDUCACION.BAJO
      
    default:
      return '#3B82F6'
  }
}

export const filtrarPorCategoria = (departamentos, categoria) => {
  switch (categoria) {
    case 'criticos':
      return departamentos.filter(d => d.indice_vulnerabilidad >= UMBRALES.VULNERABILIDAD.MUY_ALTO)
    case 'alto_riesgo':
      return departamentos.filter(d => 
        d.indice_vulnerabilidad >= UMBRALES.VULNERABILIDAD.ALTO && 
        d.indice_vulnerabilidad < UMBRALES.VULNERABILIDAD.MUY_ALTO
      )
    case 'moderados':
      return departamentos.filter(d => 
        d.indice_vulnerabilidad >= UMBRALES.VULNERABILIDAD.MEDIO && 
        d.indice_vulnerabilidad < UMBRALES.VULNERABILIDAD.ALTO
      )
    case 'estables':
      return departamentos.filter(d => d.indice_vulnerabilidad < UMBRALES.VULNERABILIDAD.MEDIO)
    default:
      return departamentos
  }
}