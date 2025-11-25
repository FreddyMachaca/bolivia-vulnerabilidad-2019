import React, { useState, useEffect } from 'react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Bar, BarChart } from 'recharts'
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, CurrencyDollarIcon, ChartBarIcon, BanknotesIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline'
import { apiCall, API_CONFIG } from '../config/api'

export default function IndicadoresEconomicos() {
  const [datosDepartamentos, setDatosDepartamentos] = useState([])
  const [datosResumen, setDatosResumen] = useState(null)
  const [indicadorSeleccionado, setIndicadorSeleccionado] = useState('ingreso')
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarDatosEconomicos()
  }, [])

  const cargarDatosEconomicos = async () => {
    try {
      const [departamentos, resumen] = await Promise.all([
        apiCall(API_CONFIG.ENDPOINTS.COMPARACION_DEPARTAMENTOS),
        apiCall(API_CONFIG.ENDPOINTS.RESUMEN_GENERAL)
      ])
      setDatosDepartamentos(departamentos)
      setDatosResumen(resumen)
    } catch (error) {
      console.error('Error cargando datos económicos:', error)
    } finally {
      setCargando(false)
    }
  }

  const obtenerDatosPorIndicador = (indicador) => {
    switch (indicador) {
      case 'ingreso':
        return datosDepartamentos.map(dept => ({
          departamento: dept.departamento,
          valor: dept.ingreso_per_capita
        }))
      case 'vulnerabilidad':
        return datosDepartamentos.map(dept => ({
          departamento: dept.departamento,
          valor: Math.abs(dept.indice_vulnerabilidad * 100)
        }))
      case 'educacion':
        return datosDepartamentos.map(dept => ({
          departamento: dept.departamento,
          valor: dept.prop_alfabeta * 100
        }))
      case 'poblacion':
        return datosDepartamentos.map(dept => ({
          departamento: dept.departamento,
          valor: dept.num_personas
        }))
      default:
        return []
    }
  }

  const datosGraficos = obtenerDatosPorIndicador(indicadorSeleccionado)

  const indicadoresResumen = datosResumen ? {
    ingresoNacional: datosResumen.ingreso_promedio,
    poblacionVulnerable: (datosResumen.distribucion_vulnerabilidad?.['Alto'] || 0) + (datosResumen.distribucion_vulnerabilidad?.['Muy Alto'] || 0),
    alfabetizacionNacional: datosResumen.alfabetizacion_promedio,
    totalHogares: datosResumen.total_hogares
  } : {}

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Indicadores Económicos Nacionales</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Ingreso Nacional Promedio</p>
                <p className="text-2xl font-bold text-blue-700">Bs {indicadoresResumen.ingresoNacional?.toFixed(0)}</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-red-50 rounded-lg">
            <div className="flex items-center">
              <ArrowTrendingDownIcon className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-red-600">Hogares Vulnerables</p>
                <p className="text-2xl font-bold text-red-700">{indicadoresResumen.poblacionVulnerable?.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">Alfabetización Nacional</p>
                <p className="text-2xl font-bold text-green-700">{indicadoresResumen.alfabetizacionNacional?.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center">
              <BanknotesIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-600">Total Hogares</p>
                <p className="text-2xl font-bold text-purple-700">{indicadoresResumen.totalHogares?.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seleccionar Indicador para Análisis
          </label>
          <select
            value={indicadorSeleccionado}
            onChange={(e) => setIndicadorSeleccionado(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ingreso">Ingreso per Cápita por Departamento</option>
            <option value="vulnerabilidad">Índice de Vulnerabilidad por Departamento</option>
            <option value="educacion">Alfabetización por Departamento</option>
            <option value="poblacion">Personas Promedio por Hogar</option>
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h4 className="text-lg font-medium text-gray-900 mb-4">
              {indicadorSeleccionado === 'ingreso' && 'Ingreso per Cápita por Departamento (Bs)'}
              {indicadorSeleccionado === 'vulnerabilidad' && 'Índice de Vulnerabilidad por Departamento (%)'}
              {indicadorSeleccionado === 'educacion' && 'Alfabetización por Departamento (%)'}
              {indicadorSeleccionado === 'poblacion' && 'Personas Promedio por Hogar'}
            </h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={datosGraficos} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="departamento" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value) => {
                    if (indicadorSeleccionado === 'ingreso') return [`Bs ${value.toFixed(0)}`, 'Ingreso']
                    if (indicadorSeleccionado === 'vulnerabilidad') return [`${value.toFixed(1)}%`, 'Vulnerabilidad']
                    if (indicadorSeleccionado === 'educacion') return [`${value.toFixed(1)}%`, 'Alfabetización']
                    if (indicadorSeleccionado === 'poblacion') return [`${value.toFixed(1)}`, 'Personas']
                    return [value, 'Valor']
                  }}
                />
                <Bar 
                  dataKey="valor" 
                  fill={
                    indicadorSeleccionado === 'ingreso' ? '#3B82F6' :
                    indicadorSeleccionado === 'vulnerabilidad' ? '#EF4444' :
                    indicadorSeleccionado === 'educacion' ? '#10B981' :
                    '#8B5CF6'
                  }
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Comparación Departamental</h4>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {datosDepartamentos
                .sort((a, b) => {
                  if (indicadorSeleccionado === 'vulnerabilidad') {
                    return Math.abs(b.indice_vulnerabilidad) - Math.abs(a.indice_vulnerabilidad)
                  } else if (indicadorSeleccionado === 'ingreso') {
                    return b.ingreso_per_capita - a.ingreso_per_capita
                  } else if (indicadorSeleccionado === 'educacion') {
                    return b.prop_alfabeta - a.prop_alfabeta
                  } else {
                    return b.num_personas - a.num_personas
                  }
                })
                .map((dept, index) => {
                  let valor, color, icono
                  
                  if (indicadorSeleccionado === 'vulnerabilidad') {
                    valor = Math.abs(dept.indice_vulnerabilidad * 100).toFixed(1) + '%'
                    color = Math.abs(dept.indice_vulnerabilidad) > 0.15 ? 'text-red-600' : 'text-green-600'
                    icono = Math.abs(dept.indice_vulnerabilidad) > 0.15 ? ArrowTrendingDownIcon : ArrowTrendingUpIcon
                  } else if (indicadorSeleccionado === 'ingreso') {
                    valor = 'Bs ' + dept.ingreso_per_capita.toFixed(0)
                    color = dept.ingreso_per_capita > 700 ? 'text-green-600' : 'text-red-600'
                    icono = dept.ingreso_per_capita > 700 ? ArrowTrendingUpIcon : ArrowTrendingDownIcon
                  } else if (indicadorSeleccionado === 'educacion') {
                    valor = (dept.prop_alfabeta * 100).toFixed(1) + '%'
                    color = dept.prop_alfabeta > 0.85 ? 'text-green-600' : 'text-yellow-600'
                    icono = dept.prop_alfabeta > 0.85 ? ArrowTrendingUpIcon : ArrowTrendingDownIcon
                  } else {
                    valor = dept.num_personas.toFixed(1) + ' personas'
                    color = 'text-blue-600'
                    icono = ClipboardDocumentCheckIcon
                  }
                  
                  const Icon = icono
                  
                  return (
                    <div key={dept.departamento} className="flex items-center justify-between p-3 bg-white rounded border">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800' :
                          index === 1 ? 'bg-gray-100 text-gray-800' :
                          index === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-50 text-gray-600'
                        }`}>
                          {index + 1}
                        </span>
                        <span className="ml-3 font-medium">{dept.departamento}</span>
                      </div>
                      <div className="flex items-center">
                        <span className={`font-semibold ${color}`}>{valor}</span>
                        <Icon className={`ml-2 h-4 w-4 ${color}`} />
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-4">
          <h4 className="font-semibold text-blue-800 mb-2">Análisis Económico</h4>
          <p className="text-blue-700 text-sm">
            {indicadorSeleccionado === 'ingreso' && 
              `El ingreso per cápita promedio nacional es de Bs ${indicadoresResumen.ingresoNacional?.toFixed(0)}. ` +
              `Los departamentos con mayores ingresos muestran menor vulnerabilidad socioeconómica.`
            }
            {indicadorSeleccionado === 'vulnerabilidad' && 
              `Se identificaron ${indicadoresResumen.poblacionVulnerable?.toLocaleString()} hogares en alta vulnerabilidad. ` +
              `Los departamentos con mayor vulnerabilidad requieren intervención inmediata.`
            }
            {indicadorSeleccionado === 'educacion' && 
              `La alfabetización nacional promedio es del ${indicadoresResumen.alfabetizacionNacional?.toFixed(1)}%. ` +
              `Los departamentos con mayor educación tienden a tener menores índices de vulnerabilidad.`
            }
            {indicadorSeleccionado === 'poblacion' && 
              `El tamaño promedio de hogar varía significativamente entre departamentos. ` +
              `Hogares más grandes suelen correlacionarse con mayor vulnerabilidad económica.`
            }
          </p>
        </div>
      </div>
    </div>
  )
}