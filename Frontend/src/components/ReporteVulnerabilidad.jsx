import React, { useState, useEffect } from 'react'
import { DocumentArrowDownIcon, PrinterIcon, ShareIcon } from '@heroicons/react/24/outline'
import { apiCall, API_CONFIG } from '../config/api'

export default function ReporteVulnerabilidad() {
  const [datos, setDatos] = useState(null)
  const [recomendaciones, setRecomendaciones] = useState([])
  const [indicadoresClave, setIndicadoresClave] = useState([])
  const [departamentosPrioritarios, setDepartamentosPrioritarios] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      const [resumen, recs, indicadores, deptos] = await Promise.all([
        apiCall(API_CONFIG.ENDPOINTS.RESUMEN_GENERAL),
        apiCall(API_CONFIG.ENDPOINTS.RECOMENDACIONES),
        apiCall(API_CONFIG.ENDPOINTS.INDICADORES_CLAVE),
        apiCall(API_CONFIG.ENDPOINTS.DEPARTAMENTOS_PRIORITARIOS)
      ])
      setDatos(resumen)
      setRecomendaciones(recs)
      setIndicadoresClave(indicadores)
      setDepartamentosPrioritarios(deptos)
    } catch (error) {
      console.error('Error cargando datos del reporte:', error)
    } finally {
      setCargando(false)
    }
  }

  if (cargando || !datos || !departamentosPrioritarios) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const fechaGeneracion = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reporte de Vulnerabilidad Socioeconómica</h1>
            <p className="text-lg text-gray-600 mt-2">Estado Plurinacional de Bolivia - Encuesta de Hogares 2019</p>
            <p className="text-sm text-gray-500 mt-1">Generado el {fechaGeneracion}</p>
          </div>
          <div className="flex space-x-2">
            <button className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              Exportar PDF
            </button>
            <button className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
              <PrinterIcon className="h-4 w-4 mr-2" />
              Imprimir
            </button>
          </div>
        </div>

        <div className="prose prose-gray max-w-none">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Resumen Ejecutivo</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            El análisis de vulnerabilidad socioeconómica de Bolivia basado en la Encuesta de Hogares 2019 
            revela que aproximadamente <strong>{((datos.distribucion_vulnerabilidad?.['Alto'] || 0) + (datos.distribucion_vulnerabilidad?.['Muy Alto'] || 0)).toLocaleString()} hogares</strong> 
            se encuentran en situación de vulnerabilidad alta o muy alta, representando el{' '}
            <strong>{(((datos.distribucion_vulnerabilidad?.['Alto'] || 0) + (datos.distribucion_vulnerabilidad?.['Muy Alto'] || 0)) / datos.total_hogares * 100).toFixed(1)}%</strong> del total de hogares analizados.
          </p>

          <p className="text-gray-700 leading-relaxed mb-6">
            Los departamentos de {departamentosPrioritarios.departamentos_criticos?.slice(0, 4).join(', ')} presentan los mayores niveles de vulnerabilidad, 
            requiriendo intervención prioritaria. El índice nacional promedio de vulnerabilidad es del{' '}
            <strong>{datos.porcentaje_hogares_vulnerables?.toFixed(1) || (datos.vulnerabilidad_promedio * 100).toFixed(1)}%</strong>, con un ingreso per cápita promedio de{' '}
            <strong>Bs {datos.ingreso_promedio?.toLocaleString()}</strong>.
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mb-4">Hallazgos Principales</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-red-50 border-l-4 border-red-500 p-4">
              <h4 className="font-semibold text-red-800 mb-2">Vulnerabilidad Crítica</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• {departamentosPrioritarios.count_criticos} departamentos en situación crítica</li>
                <li>• {(((datos.distribucion_vulnerabilidad?.['Alto'] || 0) + (datos.distribucion_vulnerabilidad?.['Muy Alto'] || 0)) / datos.total_hogares * 100).toFixed(1)}% de hogares en alta vulnerabilidad</li>
                <li>• Brecha significativa entre departamentos</li>
              </ul>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
              <h4 className="font-semibold text-blue-800 mb-2">Oportunidades</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Potencial de mejora del {(100 - (((datos.distribucion_vulnerabilidad?.['Alto'] || 0) + (datos.distribucion_vulnerabilidad?.['Muy Alto'] || 0)) / datos.total_hogares * 100)).toFixed(0)}% con intervención</li>
                <li>• Base sólida en {9 - departamentosPrioritarios.count_criticos} departamentos estables</li>
                <li>• {datos.total_hogares?.toLocaleString()} hogares analizados con datos confiables</li>
              </ul>
            </div>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mb-4">Indicadores Clave de Gestión</h3>
          <div className="overflow-x-auto mb-8">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Indicador</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Situación Actual</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Meta Estratégica</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {indicadoresClave.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.indicador}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${item.color}`}>{item.valor}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.meta}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        En progreso
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mb-4">Plan de Acción Estratégico</h3>
          <div className="space-y-4 mb-8">
            {recomendaciones.map((rec, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-gray-900">{rec.accion}</h4>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    rec.prioridad === 'Alta' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    Prioridad {rec.prioridad}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Área:</span>
                    <p className="font-medium">{rec.area}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Presupuesto:</span>
                    <p className="font-medium">{rec.presupuesto}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Plazo:</span>
                    <p className="font-medium">{rec.plazo}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Impacto:</span>
                    <p className="font-medium">{rec.impacto}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mb-4">Análisis de Riesgo y Mitigación</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Riesgos Identificados</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span><strong>Financiamiento:</strong> Limitaciones presupuestarias para programas de gran escala</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span><strong>Capacidad institucional:</strong> Necesidad de fortalecimiento en zonas rurales</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span><strong>Coordinación:</strong> Articulación entre niveles de gobierno</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Estrategias de Mitigación</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span>Implementación por fases priorizando áreas críticas</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span>Alianzas público-privadas para maximizar recursos</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span>Sistema de monitoreo continuo y ajustes adaptativos</span>
                </li>
              </ul>
            </div>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mb-4">Cronograma de Implementación</h3>
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold text-blue-800 mb-3">Corto Plazo (6 meses)</h4>
                <ul className="text-sm space-y-1">
                  <li>✓ Transferencias directas urgentes</li>
                  <li>✓ Identificación de beneficiarios</li>
                  <li>✓ Fortalecimiento institucional básico</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-green-800 mb-3">Mediano Plazo (12-18 meses)</h4>
                <ul className="text-sm space-y-1">
                  <li>→ Programas de capacitación</li>
                  <li>→ Mejoras de infraestructura</li>
                  <li>→ Servicios de salud y educación</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-purple-800 mb-3">Largo Plazo (24+ meses)</h4>
                <ul className="text-sm space-y-1">
                  <li>○ Desarrollo económico sostenible</li>
                  <li>○ Consolidación de logros</li>
                  <li>○ Evaluación de impacto integral</li>
                </ul>
              </div>
            </div>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mb-4">Conclusiones y Recomendaciones</h3>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-6">
            <h4 className="font-semibold text-blue-800 mb-3">Recomendaciones Prioritarias para Tomadores de Decisión</h4>
            <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
              <li>
                <strong>Declarar estado de emergencia social</strong> en {departamentosPrioritarios.departamentos_criticos?.slice(0, 2).join(' y ')} con asignación 
                presupuestaria inmediata para {((datos.distribucion_vulnerabilidad?.['Muy Alto'] || 0) * 3600).toLocaleString()} bolivianos en transferencias directas.
              </li>
              <li>
                <strong>Implementar sistema nacional de monitoreo</strong> de vulnerabilidad con actualización 
                trimestral y alertas tempranas para los {datos.total_hogares?.toLocaleString()} hogares registrados.
              </li>
              <li>
                <strong>Crear fondo de inversión social</strong> destinado 
                exclusivamente a reducción de vulnerabilidad para {((datos.distribucion_vulnerabilidad?.['Alto'] || 0) + (datos.distribucion_vulnerabilidad?.['Muy Alto'] || 0)).toLocaleString()} hogares prioritarios.
              </li>
              <li>
                <strong>Establecer metas cuantificables</strong>: reducir vulnerabilidad extrema de {datos.distribucion_vulnerabilidad?.['Muy Alto'] || 0} hogares en 50% 
                en 3 años y elevar ingreso promedio nacional desde Bs {datos.ingreso_promedio?.toFixed(0)} hasta Bs {(datos.ingreso_promedio * 1.4)?.toFixed(0)}.
              </li>
            </ol>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <p className="text-sm text-gray-600">
              <strong>Nota metodológica:</strong> Este análisis se basa en datos de la Encuesta de Hogares 2019 
              procesados mediante técnicas de Big Data y análisis multivariado. Los índices de vulnerabilidad 
              fueron calculados considerando indicadores de ingreso, educación, empleo y acceso a servicios básicos.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Metadatos del Análisis</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Fuente de datos:</span>
            <p className="font-medium">Encuesta de Hogares 2019 (INE)</p>
          </div>
          <div>
            <span className="text-gray-500">Método de análisis:</span>
            <p className="font-medium">Machine Learning + Análisis Multivariado</p>
          </div>
          <div>
            <span className="text-gray-500">Hogares analizados:</span>
            <p className="font-medium">{datos.total_hogares?.toLocaleString()}</p>
          </div>
          <div>
            <span className="text-gray-500">Nivel de confianza:</span>
            <p className="font-medium">95%</p>
          </div>
        </div>
      </div>
    </div>
  )
}