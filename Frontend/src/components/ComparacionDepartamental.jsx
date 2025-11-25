import React, { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import { ArrowUpIcon, ArrowDownIcon, ExclamationTriangleIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { apiCall, API_CONFIG } from '../config/api'
import { UMBRALES, obtenerColorVulnerabilidad, obtenerEstadoDepartamento, filtrarPorCategoria } from '../config/umbrales'

export default function ComparacionDepartamental() {
  const [datosDepartamentos, setDatosDepartamentos] = useState([])
  const [ordenarPor, setOrdenarPor] = useState('vulnerabilidad')
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarDatosDepartamentos()
  }, [])

  const cargarDatosDepartamentos = async () => {
    try {
      const datos = await apiCall(API_CONFIG.ENDPOINTS.COMPARACION_DEPARTAMENTOS)
      setDatosDepartamentos(datos)
    } catch (error) {
      console.error('Error cargando datos departamentales:', error)
      setDatosDepartamentos([])
    } finally {
      setCargando(false)
    }
  }

  const datosOrdenados = [...datosDepartamentos].sort((a, b) => {
    switch (ordenarPor) {
      case 'vulnerabilidad':
        return b.indice_vulnerabilidad - a.indice_vulnerabilidad
      case 'ingreso':
        return b.ingreso_per_capita - a.ingreso_per_capita
      case 'educacion':
        return b.prop_alfabeta - a.prop_alfabeta
      case 'alfabetico':
        return a.departamento.localeCompare(b.departamento)
      default:
        return 0
    }
  })



  const obtenerIconoRanking = (ranking) => {
    if (ranking <= 3) return <ArrowUpIcon className="h-4 w-4 text-green-600" />
    if (ranking >= 7) return <ArrowDownIcon className="h-4 w-4 text-red-600" />
    return <span className="h-4 w-4 bg-yellow-400 rounded-full"></span>
  }

  const datosRadar = datosDepartamentos.slice(0, 5).map(dept => ({
    departamento: dept.departamento,
    vulnerabilidad: (1 - dept.indice_vulnerabilidad) * 100,
    ingreso: (dept.ingreso_per_capita / 3500) * 100,
    educacion: dept.prop_alfabeta * 100
  }))

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-semibold text-gray-900">Ranking Departamental</h3>
        <div className="flex space-x-4">
          <select
            value={ordenarPor}
            onChange={(e) => setOrdenarPor(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="vulnerabilidad">Ordenar por Vulnerabilidad</option>
            <option value="ingreso">Ordenar por Ingreso</option>
            <option value="educacion">Ordenar por Educación</option>
            <option value="alfabetico">Orden Alfabético</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-7 gap-4 font-semibold text-sm text-gray-700">
            <div>Departamento</div>
            <div className="text-center">Ranking General</div>
            <div className="text-center">Vulnerabilidad</div>
            <div className="text-center">Ingreso per Cápita</div>
            <div className="text-center">Alfabetización</div>
            <div className="text-center">Personas/Hogar</div>
            <div className="text-center">Estado</div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {datosOrdenados.map((dept, index) => (
            <div key={dept.departamento} className="px-6 py-4 hover:bg-gray-50">
              <div className="grid grid-cols-7 gap-4 items-center">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-medium text-gray-900">{dept.departamento}</span>
                    {index < 3 && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">TOP 3</span>}
                  </div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <span className="text-xl font-bold">{index + 1}</span>
                    {obtenerIconoRanking(index + 1)}
                  </div>
                </div>

                <div className="text-center">
                  <span className={`px-2 py-1 rounded-full text-sm font-medium ${obtenerColorVulnerabilidad(dept.indice_vulnerabilidad)}`}>
                    {(dept.indice_vulnerabilidad * 100).toFixed(1)}%
                  </span>
                  <div className="text-xs text-gray-500 mt-1">#{dept.ranking_vulnerabilidad}</div>
                </div>

                <div className="text-center">
                  <div className="font-semibold">Bs {dept.ingreso_per_capita.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">#{dept.ranking_ingreso}</div>
                </div>

                <div className="text-center">
                  <div className="font-semibold">{(dept.prop_alfabeta * 100).toFixed(1)}%</div>
                  <div className="text-xs text-gray-500">#{dept.ranking_educacion}</div>
                </div>

                <div className="text-center">
                  <div className="font-semibold">{dept.num_personas.toFixed(1)}</div>
                </div>

                <div className="text-center">
                  {(() => {
                    const estado = obtenerEstadoDepartamento(dept.indice_vulnerabilidad)
                    return <span className={estado.clase}>{estado.texto}</span>
                  })()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Comparación de Vulnerabilidad</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={datosOrdenados.slice(0, 9)} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="departamento" 
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
              />
              <Tooltip 
                formatter={(value) => [`${(value * 100).toFixed(1)}%`, 'Índice de Vulnerabilidad']}
              />
              <Bar 
                dataKey="indice_vulnerabilidad" 
                fill="#EF4444"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Ingresos per Cápita</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={datosOrdenados.slice(0, 9)} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="departamento" 
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tickFormatter={(value) => `${value / 1000}k`}
              />
              <Tooltip 
                formatter={(value) => [`Bs ${value.toLocaleString()}`, 'Ingreso per Cápita']}
              />
              <Bar 
                dataKey="ingreso_per_capita" 
                fill="#10B981"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Análisis Multidimensional (Top 5 Departamentos)</h3>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={datosRadar}>
            <PolarGrid />
            <PolarAngleAxis dataKey="departamento" />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 100]} 
              tick={false}
            />
            <Radar
              name="Estabilidad (100-Vulnerabilidad)"
              dataKey="vulnerabilidad"
              stroke="#3B82F6"
              fill="#3B82F6"
              fillOpacity={0.2}
            />
            <Radar
              name="Nivel de Ingreso"
              dataKey="ingreso"
              stroke="#10B981"
              fill="#10B981"
              fillOpacity={0.2}
            />
            <Radar
              name="Alfabetización"
              dataKey="educacion"
              stroke="#F59E0B"
              fill="#F59E0B"
              fillOpacity={0.2}
            />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="font-semibold text-red-700 mb-3 flex items-center"><XCircleIcon className="h-5 w-5 mr-2" /> Intervención Inmediata</h4>
          <div className="space-y-2">
            {filtrarPorCategoria(datosDepartamentos, 'criticos')
              .map(dept => (
                <div key={dept.departamento} className="flex justify-between items-center p-2 bg-red-50 rounded">
                  <span className="font-medium">{dept.departamento}</span>
                  <span className="text-sm text-red-600">{(dept.indice_vulnerabilidad * 100).toFixed(1)}%</span>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="font-semibold text-yellow-700 mb-3 flex items-center"><ExclamationTriangleIcon className="h-5 w-5 mr-2" /> Atención Prioritaria</h4>
          <div className="space-y-2">
            {filtrarPorCategoria(datosDepartamentos, 'alto_riesgo')
              .map(dept => (
                <div key={dept.departamento} className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                  <span className="font-medium">{dept.departamento}</span>
                  <span className="text-sm text-yellow-600">{(dept.indice_vulnerabilidad * 100).toFixed(1)}%</span>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="font-semibold text-green-700 mb-3 flex items-center"><CheckCircleIcon className="h-5 w-5 mr-2" /> Estables</h4>
          <div className="space-y-2">
            {filtrarPorCategoria(datosDepartamentos, 'estables')
              .map(dept => (
                <div key={dept.departamento} className="flex justify-between items-center p-2 bg-green-50 rounded">
                  <span className="font-medium">{dept.departamento}</span>
                  <span className="text-sm text-green-600">{(dept.indice_vulnerabilidad * 100).toFixed(1)}%</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recomendaciones Estratégicas por Departamento</h3>
        <div className="space-y-4">
          {datosOrdenados.slice(0, 5).map(dept => (
            <div key={dept.departamento} className="border-l-4 border-blue-500 pl-4 py-2">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-lg">{dept.departamento}</h4>
                <span className={`px-3 py-1 rounded-full text-sm ${obtenerColorVulnerabilidad(dept.indice_vulnerabilidad)}`}>
                  Vulnerabilidad: {(dept.indice_vulnerabilidad * 100).toFixed(1)}%
                </span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                {dept.indice_vulnerabilidad >= 0.6 ? (
                  <>
                    <p>• Implementar programas de transferencias monetarias condicionadas</p>
                    <p>• Mejorar infraestructura de servicios básicos (agua, saneamiento, electricidad)</p>
                    <p>• Fortalecer sistemas de salud y educación primaria</p>
                  </>
                ) : dept.indice_vulnerabilidad >= 0.5 ? (
                  <>
                    <p>• Programas de capacitación laboral y emprendimiento</p>
                    <p>• Mejoramiento de viviendas y entorno habitacional</p>
                    <p>• Fortalecimiento de redes de protección social</p>
                  </>
                ) : (
                  <>
                    <p>• Inversión en educación técnica y superior</p>
                    <p>• Promoción de desarrollo económico local</p>
                    <p>• Consolidación de logros y sostenibilidad</p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}