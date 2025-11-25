import React, { useState, useEffect } from 'react'
import { UserGroupIcon, CurrencyDollarIcon, AcademicCapIcon, HomeIcon } from '@heroicons/react/24/outline'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { apiCall, API_CONFIG } from '../config/api'
import { UMBRALES, filtrarPorCategoria } from '../config/umbrales'

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#DC2626']

const MetricCard = ({ title, value, icon: Icon, change, color }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center">
      <div className={`flex-shrink-0 p-3 rounded-lg ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div className="ml-5 w-0 flex-1">
        <dl>
          <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
          <dd className="text-lg font-medium text-gray-900">{value}</dd>
          {change && (
            <dd className="text-sm text-gray-600">{change}</dd>
          )}
        </dl>
      </div>
    </div>
  </div>
)

export default function DashboardGeneral() {
  const [datos, setDatos] = useState(null)
  const [datosDepartamentos, setDatosDepartamentos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      const [resumen, departamentos] = await Promise.all([
        apiCall(API_CONFIG.ENDPOINTS.RESUMEN_GENERAL),
        apiCall(API_CONFIG.ENDPOINTS.COMPARACION_DEPARTAMENTOS)
      ])
      setDatos(resumen)
      setDatosDepartamentos(departamentos)
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setCargando(false)
    }
  }

  if (cargando || !datos) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const datosDistribucion = Object.entries(datos.distribucion_vulnerabilidad || {}).map(([nivel, cantidad]) => ({
    name: nivel,
    value: cantidad,
    porcentaje: ((cantidad / datos.total_hogares) * 100).toFixed(1)
  }))

  const datosVulnerabilidadDepartamental = datosDepartamentos.map(dept => ({
    departamento: dept.departamento,
    vulnerabilidad: dept.indice_vulnerabilidad,
    poblacion: Math.round(dept.num_personas * 1000)
  }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Hogares Analizados"
          value={datos.total_hogares?.toLocaleString()}
          icon={HomeIcon}
          color="bg-blue-500"
        />
        <MetricCard
          title="Personas Promedio por Hogar"
          value={datos.personas_promedio?.toFixed(1)}
          icon={UserGroupIcon}
          color="bg-green-500"
        />
        <MetricCard
          title="Ingreso Per Cápita promedio (Bs)"
          value={`Bs ${Math.round(datos.ingreso_promedio)?.toLocaleString()}`}
          icon={CurrencyDollarIcon}
          color="bg-yellow-500"
        />
        <MetricCard
          title="Alfabetización (%)"
          value={`${datos.alfabetizacion_promedio?.toFixed(1)}%`}
          icon={AcademicCapIcon}
          color="bg-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Distribución de Vulnerabilidad</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={datosDistribucion}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, porcentaje }) => `${name} (${porcentaje}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {datosDistribucion.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => value.toLocaleString()} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Vulnerabilidad por Departamento</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={datosVulnerabilidadDepartamental}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="departamento" 
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip 
                formatter={(value) => [value.toFixed(2), 'Índice de Vulnerabilidad']}
              />
              <Bar dataKey="vulnerabilidad" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Resumen Ejecutivo</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 border-l-4 border-red-500 bg-red-50">
            <h4 className="font-semibold text-red-800">Hogares en Alta Vulnerabilidad</h4>
            <p className="text-2xl font-bold text-red-600">
              {((datos.distribucion_vulnerabilidad?.['Alto'] || 0) + (datos.distribucion_vulnerabilidad?.['Muy Alto'] || 0)).toLocaleString()}
            </p>
            <p className="text-sm text-red-600">
              {(((datos.distribucion_vulnerabilidad?.['Alto'] || 0) + (datos.distribucion_vulnerabilidad?.['Muy Alto'] || 0)) / datos.total_hogares * 100).toFixed(1)}% del total
            </p>
          </div>
          
          <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50">
            <h4 className="font-semibold text-yellow-800">Hogares Vulnerables</h4>
            <p className="text-2xl font-bold text-yellow-600">
              {datos.porcentaje_hogares_vulnerables ? datos.porcentaje_hogares_vulnerables.toFixed(1) : 
               (((datos.distribucion_vulnerabilidad?.['Alto'] || 0) + (datos.distribucion_vulnerabilidad?.['Muy Alto'] || 0)) / datos.total_hogares * 100).toFixed(1)}%
            </p>
            <p className="text-sm text-yellow-600">En situación de alta vulnerabilidad</p>
          </div>
          
          <div className="p-4 border-l-4 border-green-500 bg-green-50">
            <h4 className="font-semibold text-green-800">Departamentos Prioritarios</h4>
            <p className="text-2xl font-bold text-green-600">
              {filtrarPorCategoria(datosDepartamentos, 'criticos').length + filtrarPorCategoria(datosDepartamentos, 'alto_riesgo').length}
            </p>
            <p className="text-sm text-green-600">
              {[...filtrarPorCategoria(datosDepartamentos, 'criticos'), ...filtrarPorCategoria(datosDepartamentos, 'alto_riesgo')]
                .sort((a, b) => b.indice_vulnerabilidad - a.indice_vulnerabilidad)
                .slice(0, 4)
                .map(d => d.departamento)
                .join(', ')}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Indicadores Clave para Toma de Decisiones</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <span className="font-medium">Prioridad de Intervención</span>
            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
              Inmediata en {filtrarPorCategoria(datosDepartamentos, 'criticos').length + filtrarPorCategoria(datosDepartamentos, 'alto_riesgo').length} departamentos
            </span>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <span className="font-medium">Focalización de Programas</span>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
              {((datos.distribucion_vulnerabilidad?.['Alto'] || 0) + (datos.distribucion_vulnerabilidad?.['Muy Alto'] || 0)).toLocaleString()} hogares en riesgo alto
            </span>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <span className="font-medium">Inversión Requerida</span>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              Estimado: Bs {(((datos.distribucion_vulnerabilidad?.['Alto'] || 0) + (datos.distribucion_vulnerabilidad?.['Muy Alto'] || 0)) * 5500).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}