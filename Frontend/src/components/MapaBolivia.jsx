import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { ExclamationTriangleIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { apiCall, API_CONFIG } from '../config/api'
import { UMBRALES, obtenerColorMapa, obtenerNivelVulnerabilidad } from '../config/umbrales'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

export default function MapaBolivia() {
  const [datosGeograficos, setDatosGeograficos] = useState(null)
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState(null)
  const [capaPorVer, setCapaPorVer] = useState('vulnerabilidad')
  const [rangosIndicadores, setRangosIndicadores] = useState(null)

  useEffect(() => {
    cargarDatosGeograficos()
    cargarRangosIndicadores()
  }, [])

  const cargarDatosGeograficos = async () => {
    try {
      const geojson = await apiCall(API_CONFIG.ENDPOINTS.GEOJSON_BOLIVIA)
      setDatosGeograficos(geojson)
    } catch (error) {
      console.error('Error cargando datos geográficos:', error)
      setDatosGeograficos(null)
    }
  }

  const cargarRangosIndicadores = async () => {
    try {
      const rangos = await apiCall(API_CONFIG.ENDPOINTS.RANGOS_INDICADORES)
      setRangosIndicadores(rangos)
    } catch (error) {
      console.error('Error cargando rangos:', error)
      setRangosIndicadores(null)
    }
  }

  const getColorForValue = (value, tipo) => {
    return obtenerColorMapa(value, tipo)
  }

  const createCustomIcon = (feature) => {
    let valor, tipo
    
    switch (capaPorVer) {
      case 'vulnerabilidad':
        valor = feature.properties.vulnerabilidad
        tipo = 'vulnerabilidad'
        break
      case 'ingreso_per_capita':
        valor = feature.properties.ingreso_per_capita
        tipo = 'ingreso_per_capita'
        break
      case 'alfabetizacion':
        valor = feature.properties.alfabetizacion
        tipo = 'alfabetizacion'
        break
      default:
        valor = feature.properties.vulnerabilidad
        tipo = 'vulnerabilidad'
    }
    
    const color = getColorForValue(valor, tipo)
    
    return new L.DivIcon({
      html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.4); opacity: 0.9;"></div>`,
      className: 'custom-div-icon',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    })
  }

  const obtenerEtiquetaValor = (valor, tipo) => {
    switch (tipo) {
      case 'vulnerabilidad':
        return `${(valor * 100).toFixed(1)}%`
      case 'ingreso':
        return `Bs ${valor.toLocaleString()}`
      case 'educacion':
        return `${valor.toFixed(1)}%`
      default:
        return valor.toString()
    }
  }

  const obtenerNivelVulnerabilidad = (valor) => {
    if (!rangosIndicadores) return { nivel: 'Desconocido', color: 'text-gray-600 bg-gray-50' }
    
    const vRangos = rangosIndicadores.vulnerabilidad
    if (valor >= vRangos.muy_alto) return { nivel: 'Muy Alto', color: 'text-red-800 bg-red-100' }
    if (valor >= vRangos.alto) return { nivel: 'Alto', color: 'text-red-600 bg-red-50' }
    if (valor >= vRangos.medio) return { nivel: 'Medio', color: 'text-yellow-600 bg-yellow-50' }
    return { nivel: 'Bajo', color: 'text-green-600 bg-green-50' }
  }

  if (!datosGeograficos || !rangosIndicadores) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Cargando datos...</span>
      </div>
    )
  }

  return (
    <div className="h-screen flex">
      <div className="flex-1">
        <div className="mb-4 flex space-x-4">
          <select
            value={capaPorVer}
            onChange={(e) => setCapaPorVer(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="vulnerabilidad">Índice de Vulnerabilidad</option>
            <option value="ingreso_per_capita">Ingreso per Cápita</option>
            <option value="alfabetizacion">Alfabetización</option>
          </select>
        </div>

        <div className="relative">
          <MapContainer
            center={[-16.5, -64.0]}
            zoom={6}
            style={{ height: 'calc(100vh - 200px)', width: '100%' }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {datosGeograficos.features.map((feature, index) => (
              <Marker
                key={index}
                position={[feature.geometry.coordinates[1], feature.geometry.coordinates[0]]}
                icon={createCustomIcon(feature)}
                eventHandlers={{
                  click: () => setDepartamentoSeleccionado(feature.properties)
                }}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-bold text-lg">{feature.properties.departamento}</h3>
                    <div className="space-y-1 mt-2">
                      <p>Vulnerabilidad: {obtenerEtiquetaValor(feature.properties.vulnerabilidad, 'vulnerabilidad')}</p>
                      <p>Ingreso: {obtenerEtiquetaValor(feature.properties.ingreso_per_capita, 'ingreso')}</p>
                      <p>Alfabetización: {obtenerEtiquetaValor(feature.properties.alfabetizacion, 'educacion')}</p>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg z-10">
            <h4 className="font-semibold mb-3">Leyenda - {capaPorVer.replace('_', ' ')}</h4>
            <div className="space-y-2 text-sm">
              {capaPorVer === 'vulnerabilidad' && (
                <>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <span>Bajo (&lt;{(UMBRALES.VULNERABILIDAD.MEDIO * 100).toFixed(0)}%)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                    <span>Medio ({(UMBRALES.VULNERABILIDAD.MEDIO * 100).toFixed(0)}% - {(UMBRALES.VULNERABILIDAD.ALTO * 100).toFixed(0)}%)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-red-400 rounded-full"></div>
                    <span>Alto ({(UMBRALES.VULNERABILIDAD.ALTO * 100).toFixed(0)}% - {(UMBRALES.VULNERABILIDAD.MUY_ALTO * 100).toFixed(0)}%)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-red-600 rounded-full"></div>
                    <span>Muy Alto ({(UMBRALES.VULNERABILIDAD.MUY_ALTO * 100).toFixed(0)}%+)</span>
                  </div>
                </>
              )}
              {capaPorVer === 'ingreso_per_capita' && (
                <>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <span>Alto ({UMBRALES.INGRESO_PER_CAPITA.ALTO}+ Bs)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                    <span>Medio ({UMBRALES.INGRESO_PER_CAPITA.MEDIO}-{UMBRALES.INGRESO_PER_CAPITA.ALTO} Bs)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                    <span>Bajo (&lt;{UMBRALES.INGRESO_PER_CAPITA.MEDIO} Bs)</span>
                  </div>
                </>
              )}
              {capaPorVer === 'alfabetizacion' && (
                <>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <span>Alto ({(UMBRALES.ALFABETIZACION.ALTO * 100).toFixed(0)}%+)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                    <span>Medio ({(UMBRALES.ALFABETIZACION.MEDIO * 100).toFixed(0)}%-{(UMBRALES.ALFABETIZACION.ALTO * 100).toFixed(0)}%)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                    <span>Bajo (&lt;{(UMBRALES.ALFABETIZACION.MEDIO * 100).toFixed(0)}%)</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {departamentoSeleccionado && (
        <div className="w-80 bg-white shadow-lg p-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">{departamentoSeleccionado.departamento}</h3>
            <button
              onClick={() => setDepartamentoSeleccionado(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-gray-700">Nivel de Vulnerabilidad</h4>
              <div className="mt-2">
                <span className={`px-3 py-1 rounded-full text-sm ${obtenerNivelVulnerabilidad(departamentoSeleccionado.vulnerabilidad).color}`}>
                  {obtenerNivelVulnerabilidad(departamentoSeleccionado.vulnerabilidad).nivel}
                </span>
                <p className="mt-1 text-lg font-bold">{(departamentoSeleccionado.vulnerabilidad * 100).toFixed(1)}%</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Ingreso per Cápita:</span>
                <span className="font-semibold">Bs {departamentoSeleccionado.ingreso_per_capita?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Alfabetización:</span>
                <span className="font-semibold">{departamentoSeleccionado.alfabetizacion?.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Personas por Hogar:</span>
                <span className="font-semibold">{departamentoSeleccionado.personas_promedio?.toFixed(1)}</span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-semibold text-gray-700 mb-2">Recomendaciones</h4>
              {rangosIndicadores && departamentoSeleccionado.vulnerabilidad >= rangosIndicadores.vulnerabilidad.muy_alto ? (
                <div className="space-y-2 text-sm">
                  <p className="text-red-700 flex items-center"><XCircleIcon className="h-4 w-4 mr-1" /> Intervención prioritaria inmediata</p>
                  <p>• Programas de transferencias monetarias</p>
                  <p>• Mejora de infraestructura educativa</p>
                  <p>• Generación de empleo local</p>
                </div>
              ) : rangosIndicadores && departamentoSeleccionado.vulnerabilidad >= rangosIndicadores.vulnerabilidad.alto ? (
                <div className="space-y-2 text-sm">
                  <p className="text-yellow-700 flex items-center"><ExclamationTriangleIcon className="h-4 w-4 mr-1" /> Atención prioritaria</p>
                  <p>• Fortalecimiento de servicios básicos</p>
                  <p>• Capacitación laboral</p>
                  <p>• Programas nutricionales</p>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <p className="text-green-700 flex items-center"><CheckCircleIcon className="h-4 w-4 mr-1" /> Mantener y fortalecer logros</p>
                  <p>• Monitoreo continuo</p>
                  <p>• Inversión en educación superior</p>
                  <p>• Desarrollo económico sostenible</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}