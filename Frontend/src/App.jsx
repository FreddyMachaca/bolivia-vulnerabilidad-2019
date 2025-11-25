import React, { useState, useEffect } from 'react'
import { ChartBarIcon, MapIcon, UserGroupIcon, CurrencyDollarIcon, AcademicCapIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline'
import { apiCall, API_CONFIG } from './config/api'
import MapaBolivia from './components/MapaBolivia'
import DashboardGeneral from './components/DashboardGeneral'
import AnalisisClusters from './components/AnalisisClusters'
import ComparacionDepartamental from './components/ComparacionDepartamental'
import IndicadoresEconomicos from './components/IndicadoresEconomicos'
import ReporteVulnerabilidad from './components/ReporteVulnerabilidad'

function App() {
  const [menuActivo, setMenuActivo] = useState('dashboard')
  const [datosGenerales, setDatosGenerales] = useState(null)
  const [cargando, setCargando] = useState(true)

  const menuItems = [
    { id: 'dashboard', nombre: 'Dashboard General', icono: ChartBarIcon },
    { id: 'mapa', nombre: 'Mapa Interactivo', icono: MapIcon },
    { id: 'clusters', nombre: 'Análisis por Clusters', icono: UserGroupIcon },
    { id: 'departamentos', nombre: 'Comparación Departamental', icono: ClipboardDocumentListIcon },
    { id: 'economicos', nombre: 'Indicadores Económicos', icono: CurrencyDollarIcon },
    { id: 'reporte', nombre: 'Reporte de Vulnerabilidad', icono: AcademicCapIcon }
  ]

  useEffect(() => {
    cargarDatosGenerales()
  }, [])

  const cargarDatosGenerales = async () => {
    try {
      const datos = await apiCall(API_CONFIG.ENDPOINTS.RESUMEN_GENERAL)
      setDatosGenerales(datos)
    } catch (error) {
      console.error('Error cargando datos:', error)
      setDatosGenerales(null)
    } finally {
      setCargando(false)
    }
  }

  const renderContenido = () => {
    if (cargando) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      )
    }

    switch (menuActivo) {
      case 'dashboard':
        return <DashboardGeneral />
      case 'mapa':
        return <MapaBolivia />
      case 'clusters':
        return <AnalisisClusters />
      case 'departamentos':
        return <ComparacionDepartamental />
      case 'economicos':
        return <IndicadoresEconomicos />
      case 'reporte':
        return <ReporteVulnerabilidad />
      default:
        return <DashboardGeneral />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="w-64 bg-white shadow-lg flex-shrink-0 fixed h-full overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">Vulnerabilidad Bolivia</h1>
          <p className="text-sm text-gray-600 mt-1">Análisis Socioeconómico</p>
        </div>
        
        <nav className="mt-6 pb-20">
          {menuItems.map((item) => {
            const Icon = item.icono
            return (
              <button
                key={item.id}
                onClick={() => setMenuActivo(item.id)}
                className={`w-full flex items-center px-6 py-3 text-left transition-colors duration-200 ${
                  menuActivo === item.id 
                    ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="h-5 w-5 mr-3" />
                <span className="text-sm font-medium">{item.nombre}</span>
              </button>
            )
          })}
        </nav>

        {datosGenerales && (
          <div className="absolute bottom-0 left-0 right-0 w-64 p-4 border-t border-gray-200 bg-gray-50">
            <div className="text-xs text-gray-500">
              <p className="font-semibold">Resumen Rápido</p>
              <p>{datosGenerales.total_hogares?.toLocaleString()} hogares analizados</p>
              <p>Vulnerabilidad: {(datosGenerales.vulnerabilidad_promedio * 100)?.toFixed(1)}%</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 ml-64">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              {menuItems.find(item => item.id === menuActivo)?.nombre}
            </h2>
            <p className="text-gray-600 mt-1">Encuesta de Hogares 2019 - Análisis de Big Data</p>
          </div>
        </header>
        
        <main className="p-6">
          {renderContenido()}
        </main>
      </div>
    </div>
  )
}

export default App