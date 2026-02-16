# Análisis de Vulnerabilidad Socioeconómica en Bolivia

Sistema de análisis de Big Data para la identificación de hogares y zonas en riesgo mediante el procesamiento de datos de la Encuesta de Hogares 2019 de Bolivia.

## Descripción del Proyecto

Este proyecto utiliza técnicas avanzadas de Big Data y Machine Learning para:

- **Analizar** 150,000+ hogares de la Encuesta EH2019
- **Identificar** patrones de vulnerabilidad socioeconómica
- **Clasificar** hogares en tipologías de riesgo
- **Visualizar** datos geográficos interactivos
- **Generar** reportes para toma de decisiones

## Estructura del Proyecto

```
bolivia_vulnerabilidad/
├── Base EH2019/           # Datos originales CSV (240+ MB)
│   ├── EH2019_Persona/
│   ├── EH2019_Vivienda/
│   ├── EH2019_GastosAlimentarios/
│   ├── EH2019_GastosNoAlimentarios/
│   ├── EH2019_Equipamiento/
│   ├── EH2019_SeguridadAlimentaria/
│   └── EH2019_Discriminacion/
├── BigData/              # Análisis y procesamiento
│   ├── vulnerabilidad_analyzer.py
│   ├── api_server.py
│   └── requirements.txt
└── Frontend/             # Dashboard interactivo
    ├── src/
    │   ├── components/
    │   │   ├── DashboardGeneral.jsx
    │   │   ├── MapaBolivia.jsx
    │   │   ├── AnalisisClusters.jsx
    │   │   ├── ComparacionDepartamental.jsx
    │   │   ├── IndicadoresEconomicos.jsx
    │   └── ReporteVulnerabilidad.jsx
    │   └── App.jsx
    │── env.example
    └── package.json
```


##  Manual de Ejecución Paso a Paso

Sigue esta guía completa para levantar todo el ecosistema (procesamiento, API y dashboard).


### 1. Prerrequisitos
- **Python 3.10+** y `pip` disponibles (`python3 --version`).
- **Node.js 18+** con `npm` (`node --version`).
- **Git** para clonar el repositorio.
- Espacio libre ≥ **4 GB** para los CSV de EH2019.

### 2. Configurar entorno Python
```bash
cd BigData
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```
> Si prefieres no usar entorno virtual, omite las dos líneas del `venv`, pero asegúrate de tener permisos de instalación global.

### 3. Configurar variables de entorno del Frontend
```bash
cd Frontend
cp .env.example .env
```
- Edita el archivo `.env` si necesitas cambiar la URL de la API: `nano .env` o `vim .env`.


### 4. Ejecutar análisis y validar salidas
```bash
cd BigData
python3 vulnerabilidad_analyzer.py
```
- Revisa la consola: al final verás métricas agregadas y archivos intermedios en `BigData/output` (se crean en la primera corrida).
- Si falta algún CSV, el script lo reportará; corrige las rutas antes de continuar.

### 5. Levantar la API Flask
```bash
cd BigData
python3 api_server.py
```
- El endpoint raíz se expone en `http://localhost:5000/api`.
- Mantén esta terminal abierta para que el frontend pueda consumir la API.

### 6. Configurar el Frontend (Vite + React)
```bash
cd Frontend
npm install
```

### 7. Ejecutar el dashboard en desarrollo
```bash
npm run dev
```
- Accede desde el navegador a `http://localhost:5173` (o la URL que muestre Vite).

### 8. Construir para producción (opcional)
```bash
npm run build
npm run preview
```
- El bundle queda en `Frontend/dist`. Usa `npm run preview` para validar antes de desplegar.

---

## Solución de problemas comunes
- **Error de CORS**: confirma que la API responde en `localhost:5000` y que `VITE_API_BASE_URL` coincide.
- **CSV no encontrado**: revisa que las carpetas sigan la estructura de `Base EH2019` y que los archivos no estén comprimidos.
- **Puerto ocupado**: cambia el puerto de Flask (`PORT` en `api_server.py`) y actualiza `VITE_API_BASE_URL`.
- **Dependencias antiguas**: elimina `Frontend/node_modules` y ejecuta `npm install` nuevamente.
- **Permisos en Linux**: usa `sudo npm install -g` si hay problemas con permisos globales de npm.

## Características del Dashboard

### Dashboard General
- Métricas clave de vulnerabilidad nacional
- Distribución de hogares por nivel de riesgo
- Gráficos de vulnerabilidad departamental
- Resumen ejecutivo para tomadores de decisión

### Mapa Interactivo
- Visualización geográfica de Bolivia
- Capas temáticas (vulnerabilidad, ingresos, educación)
- Información detallada por departamento
- Recomendaciones específicas por región

### Análisis por Clusters
- 5 tipologías de hogares identificadas
- Características sociodemográficas
- Estrategias diferenciadas por cluster
- Métricas de priorización

### Comparación Departamental
- Ranking departamental completo
- Análisis multidimensional
- Indicadores de gestión
- Cronograma de intervenciones

### Indicadores Económicos
- Evolución temporal de indicadores
- Análisis de eficiencia presupuestaria
- ROI estimado por intervención
- Proyecciones financieras

### Reporte de Vulnerabilidad
- Reporte ejecutivo completo
- Plan de acción estratégico
- Análisis de riesgo
- Cronograma de implementación

## Metodología de Análisis

### Índice de Vulnerabilidad
Combina múltiples dimensiones:
- **Económica**: Ingresos per cápita, gastos del hogar
- **Social**: Nivel educativo, alfabetización
- **Demográfica**: Tamaño del hogar, dependencia económica
- **Habitacional**: Condiciones de vivienda y servicios

### Clustering de Hogares
Utiliza algoritmos K-means para identificar:
1. **Cluster 0**: Hogares urbanos estables
2. **Cluster 1**: Hogares rurales moderados  
3. **Cluster 2**: Hogares en extrema vulnerabilidad
4. **Cluster 3**: Hogares periurbanos emergentes
5. **Cluster 4**: Hogares de alto estrato

### Análisis Geoespacial
- Agregación por departamentos
- Mapeo de coordenadas de capitales
- Visualización con Leaflet/React

## Endpoints de la API

```
GET /api/resumen-general              # Estadísticas nacionales
GET /api/datos-departamentos          # Datos por departamento
GET /api/geojson-bolivia              # GeoJSON con datos integrados
GET /api/analisis-clusters            # Análisis de tipologías
GET /api/comparacion-departamentos    # Rankings y comparaciones
```


## Tecnologías Utilizadas

### Backend:
- **Python**: Pandas, NumPy, Scikit-learn
- **Flask**: API REST
- **Matplotlib/Plotly**: Visualizaciones

### Frontend:
- **React**: Interface de usuario
- **Tailwind CSS**: Diseño responsivo
- **Recharts**: Gráficos interactivos
- **Leaflet**: Mapas geográficos
- **Heroicons**: Iconografía

### Datos:
- **Encuesta de Hogares 2019** (INE Bolivia)
- **240+ MB** de datos estructurados
- **7 módulos** temáticos integrados
