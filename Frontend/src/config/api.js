export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL,
  ENDPOINTS: {
    RESUMEN_GENERAL: '/resumen-general',
    DATOS_DEPARTAMENTOS: '/datos-departamentos',
    GEOJSON_BOLIVIA: '/geojson-bolivia',
    ANALISIS_CLUSTERS: '/analisis-clusters',
    COMPARACION_DEPARTAMENTOS: '/comparacion-departamentos',
    RECOMENDACIONES: '/recomendaciones',
    INDICADORES_CLAVE: '/indicadores-clave',
    DEPARTAMENTOS_PRIORITARIOS: '/departamentos-prioritarios',
    RANGOS_INDICADORES: '/rangos-indicadores'
  }
}

export const apiCall = async (endpoint) => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Error en API: ${response.status}`)
  }
  return response.json()
}