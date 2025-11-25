import React, { useState, useEffect } from 'react'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { apiCall, API_CONFIG } from '../config/api'

export default function AnalisisClusters() {
  const [datosClusters, setDatosClusters] = useState([])
  const [clusterSeleccionado, setClusterSeleccionado] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarDatosClusters()
  }, [])

  const cargarDatosClusters = async () => {
    try {
      const datos = await apiCall(API_CONFIG.ENDPOINTS.ANALISIS_CLUSTERS)
      setDatosClusters(datos)
    } catch (error) {
      console.error('Error cargando clusters:', error)
      setDatosClusters([])
    } finally {
      setCargando(false)
    }
  }

  const obtenerColorCluster = (clusterId) => {
    const colores = ['#10B981', '#3B82F6', '#EF4444', '#F59E0B', '#8B5CF6']
    return colores[clusterId % colores.length]
  }

  const obtenerNivelPrioridad = (vulnerabilidad) => {
    if (vulnerabilidad >= 0.6) return { nivel: 'Crítica', color: 'bg-red-100 text-red-800' }
    if (vulnerabilidad >= 0.5) return { nivel: 'Alta', color: 'bg-orange-100 text-orange-800' }
    if (vulnerabilidad >= 0.3) return { nivel: 'Media', color: 'bg-yellow-100 text-yellow-800' }
    return { nivel: 'Baja', color: 'bg-green-100 text-green-800' }
  }

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
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Tipologías de Hogares Identificadas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {datosClusters.map((cluster) => {
            const prioridad = obtenerNivelPrioridad(cluster.vulnerabilidad_promedio)
            return (
              <div
                key={cluster.cluster_id}
                onClick={() => setClusterSeleccionado(cluster)}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer transition-colors"
                style={{ borderLeftColor: obtenerColorCluster(cluster.cluster_id), borderLeftWidth: '4px' }}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-lg">Cluster {cluster.cluster_id}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs ${prioridad.color}`}>
                    {prioridad.nivel}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-3">{cluster.descripcion}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Hogares:</span>
                    <span className="font-medium">{cluster.total_hogares.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Vulnerabilidad:</span>
                    <span className="font-medium">{(cluster.vulnerabilidad_promedio * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ingreso:</span>
                    <span className="font-medium">Bs {cluster.ingreso_promedio.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Alfabetización:</span>
                    <span className="font-medium">{cluster.alfabetizacion.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Distribución por Vulnerabilidad vs Ingresos</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid />
              <XAxis 
                dataKey="ingreso_promedio" 
                name="Ingreso Promedio" 
                type="number" 
                domain={[0, 8000]}
                tickFormatter={(value) => `${value / 1000}k`}
              />
              <YAxis 
                dataKey="vulnerabilidad_promedio" 
                name="Vulnerabilidad" 
                type="number" 
                domain={[0, 1]}
                tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
              />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'vulnerabilidad_promedio' ? `${(value * 100).toFixed(1)}%` : `Bs ${value.toLocaleString()}`,
                  name === 'vulnerabilidad_promedio' ? 'Vulnerabilidad' : 'Ingreso'
                ]}
                labelFormatter={(label) => `Cluster ${label}`}
              />
              <Scatter 
                data={datosClusters} 
                fill="#8884d8"
                shape="circle"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tamaño de Clusters por Número de Hogares</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={datosClusters} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="cluster_id" tickFormatter={(value) => `Cluster ${value}`} />
              <YAxis tickFormatter={(value) => `${value / 1000}k`} />
              <Tooltip formatter={(value) => [value.toLocaleString(), 'Hogares']} />
              <Bar 
                dataKey="total_hogares" 
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {clusterSeleccionado && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Análisis Detallado - Cluster {clusterSeleccionado.cluster_id}</h3>
            <button
              onClick={() => setClusterSeleccionado(null)}
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
            >
              Cerrar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-700">Características Principales</h4>
              <div className="space-y-2">
                {clusterSeleccionado.caracteristicas?.map((caracteristica, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">{caracteristica}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-700">Indicadores Clave</h4>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Nivel de Vulnerabilidad</span>
                    <span className="font-semibold">{(clusterSeleccionado.vulnerabilidad_promedio * 100).toFixed(1)}%</span>
                  </div>
                  <div className="mt-1 h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-full bg-red-500 rounded-full" 
                      style={{ width: `${clusterSeleccionado.vulnerabilidad_promedio * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Alfabetización</span>
                    <span className="font-semibold">{clusterSeleccionado.alfabetizacion.toFixed(1)}%</span>
                  </div>
                  <div className="mt-1 h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-full bg-green-500 rounded-full" 
                      style={{ width: `${clusterSeleccionado.alfabetizacion}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-700">Estrategias Recomendadas</h4>
              <div className="space-y-2 text-sm">
                {clusterSeleccionado.vulnerabilidad_promedio >= 0.6 && (
                  <>
                    <p className="font-medium text-red-700">Intervención Inmediata:</p>
                    <p>• Transferencias monetarias directas</p>
                    <p>• Programas de alimentación escolar</p>
                    <p>• Acceso prioritario a servicios de salud</p>
                    <p>• Capacitación laboral urgente</p>
                  </>
                )}
                {clusterSeleccionado.vulnerabilidad_promedio >= 0.4 && clusterSeleccionado.vulnerabilidad_promedio < 0.6 && (
                  <>
                    <p className="font-medium text-yellow-700">Programas Focalizados:</p>
                    <p>• Mejoramiento de vivienda</p>
                    <p>• Microcréditos para emprendimientos</p>
                    <p>• Programas educativos para adultos</p>
                    <p>• Fortalecimiento comunitario</p>
                  </>
                )}
                {clusterSeleccionado.vulnerabilidad_promedio < 0.4 && (
                  <>
                    <p className="font-medium text-green-700">Consolidación y Crecimiento:</p>
                    <p>• Inversión en educación superior</p>
                    <p>• Programas de innovación</p>
                    <p>• Desarrollo empresarial</p>
                    <p>• Fortalecimiento institucional</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-blue-50 rounded">
                <p className="text-2xl font-bold text-blue-600">{clusterSeleccionado.total_hogares.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Total de Hogares</p>
              </div>
              <div className="p-3 bg-green-50 rounded">
                <p className="text-2xl font-bold text-green-600">Bs {clusterSeleccionado.ingreso_promedio.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Ingreso Promedio</p>
              </div>
              <div className="p-3 bg-purple-50 rounded">
                <p className="text-2xl font-bold text-purple-600">{clusterSeleccionado.personas_promedio.toFixed(1)}</p>
                <p className="text-sm text-gray-600">Personas por Hogar</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded">
                <p className="text-2xl font-bold text-yellow-600">{clusterSeleccionado.educacion_promedio.toFixed(1)}</p>
                <p className="text-sm text-gray-600">Años de Educación</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Resumen para Toma de Decisiones</h3>
        <div className="space-y-4">
          <div className="p-4 border-l-4 border-red-500 bg-red-50">
            <h4 className="font-semibold text-red-800">Prioridad Inmediata</h4>
            <p className="text-red-700">
              {datosClusters.filter(c => c.vulnerabilidad_promedio >= 0.6).reduce((sum, c) => sum + c.total_hogares, 0).toLocaleString()}{' '}
              hogares en situación crítica requieren intervención inmediata
            </p>
          </div>
          <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50">
            <h4 className="font-semibold text-yellow-800">Programas Focalizados</h4>
            <p className="text-yellow-700">
              {datosClusters.filter(c => c.vulnerabilidad_promedio >= 0.4 && c.vulnerabilidad_promedio < 0.6).reduce((sum, c) => sum + c.total_hogares, 0).toLocaleString()}{' '}
              hogares necesitan programas de fortalecimiento
            </p>
          </div>
          <div className="p-4 border-l-4 border-green-500 bg-green-50">
            <h4 className="font-semibold text-green-800">Consolidación</h4>
            <p className="text-green-700">
              {datosClusters.filter(c => c.vulnerabilidad_promedio < 0.4).reduce((sum, c) => sum + c.total_hogares, 0).toLocaleString()}{' '}
              hogares estables para programas de crecimiento
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}