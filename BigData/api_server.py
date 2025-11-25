import json
import pandas as pd
import numpy as np
from flask import Flask, jsonify, send_file
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

class DataProcessor:
    def __init__(self):
        self.vulnerabilidad_data = None
        self.departamentos_data = None
        self.geojson_data = None
        self.load_data()
    
    def load_data(self):
        try:
            if os.path.exists('vulnerabilidad_hogares.csv'):
                self.vulnerabilidad_data = pd.read_csv('vulnerabilidad_hogares.csv')
            if os.path.exists('vulnerabilidad_departamentos.csv'):
                self.departamentos_data = pd.read_csv('vulnerabilidad_departamentos.csv')
            
            # GeoJSON de Bolivia
            self.geojson_data = {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "properties": {
                            "departamento": "Santa Cruz",
                            "codigo": "07",
                            "capital": "Santa Cruz"
                        },
                        "geometry": {"type": "Point", "coordinates": [-63.179501971999969, -17.783799575999979]}
                    },
                    {
                        "type": "Feature", 
                        "properties": {
                            "departamento": "Oruro",
                            "codigo": "04", 
                            "capital": "Oruro"
                        },
                        "geometry": {"type": "Point", "coordinates": [-67.113784220999946, -17.971244431999935]}
                    },
                    {
                        "type": "Feature",
                        "properties": {
                            "departamento": "Tarija",
                            "codigo": "06",
                            "capital": "Tarija"
                        },
                        "geometry": {"type": "Point", "coordinates": [-64.729192995999938, -21.534407185999953]}
                    },
                    {
                        "type": "Feature",
                        "properties": {
                            "departamento": "Chuquisaca",
                            "codigo": "01", 
                            "capital": "Sucre"
                        },
                        "geometry": {"type": "Point", "coordinates": [-65.259186264999983, -19.047794946999943]}
                    },
                    {
                        "type": "Feature",
                        "properties": {
                            "departamento": "Cochabamba",
                            "codigo": "03",
                            "capital": "Cochabamba"
                        },
                        "geometry": {"type": "Point", "coordinates": [-66.15546797899998, -17.388209582999934]}
                    },
                    {
                        "type": "Feature",
                        "properties": {
                            "departamento": "Beni",
                            "codigo": "08",
                            "capital": "Trinidad"
                        },
                        "geometry": {"type": "Point", "coordinates": [-64.90410282199997, -14.835349107999946]}
                    },
                    {
                        "type": "Feature",
                        "properties": {
                            "departamento": "Potosí",
                            "codigo": "05",
                            "capital": "Potosí"
                        },
                        "geometry": {"type": "Point", "coordinates": [-65.752843143999939, -19.582769269999972]}
                    },
                    {
                        "type": "Feature",
                        "properties": {
                            "departamento": "La Paz",
                            "codigo": "02",
                            "capital": "La Paz"
                        },
                        "geometry": {"type": "Point", "coordinates": [-68.13422015499998, -16.495135819999973]}
                    },
                    {
                        "type": "Feature",
                        "properties": {
                            "departamento": "Pando",
                            "codigo": "09",
                            "capital": "Cobija"
                        },
                        "geometry": {"type": "Point", "coordinates": [-68.762657833999981, -11.028201720999959]}
                    }
                ]
            }
        except Exception as e:
            print(f"Error cargando datos: {e}")

processor = DataProcessor()

@app.route('/api/resumen-general')
def resumen_general():
    if processor.vulnerabilidad_data is None:
        return jsonify({"error": "Datos no disponibles"})
    
    data = processor.vulnerabilidad_data
    
    total_hogares = len(data)
    distribución = data['nivel_vulnerabilidad'].value_counts().to_dict()
    hogares_alta_vuln = distribución.get('Alto', 0) + distribución.get('Muy Alto', 0)
    porcentaje_vulnerable = (hogares_alta_vuln / total_hogares) * 100
    
    resumen = {
        "total_hogares": total_hogares,
        "vulnerabilidad_promedio": porcentaje_vulnerable / 100,
        "porcentaje_hogares_vulnerables": porcentaje_vulnerable,
        "ingreso_promedio": float(data['ingreso_per_capita'].mean()),
        "alfabetizacion_promedio": float(data['prop_alfabeta'].mean() * 100),
        "personas_promedio": float(data['num_personas'].mean()),
        "distribucion_vulnerabilidad": distribución
    }
    
    return jsonify(resumen)

@app.route('/api/datos-departamentos')
def datos_departamentos():
    if processor.departamentos_data is None:
        return jsonify({"error": "Datos departamentales no disponibles"})
    
    return jsonify(processor.departamentos_data.to_dict('records'))

@app.route('/api/geojson-bolivia')
def geojson_bolivia():
    features_with_data = []
    
    for feature in processor.geojson_data['features']:
        dept_name = feature['properties']['departamento']
        
        if processor.departamentos_data is not None:
            dept_data = processor.departamentos_data[
                processor.departamentos_data['departamento'] == dept_name
            ]
            
            if not dept_data.empty:
                feature['properties'].update({
                    'departamento': dept_name,
                    'vulnerabilidad': float(dept_data.iloc[0]['indice_vulnerabilidad']),
                    'ingreso_per_capita': float(dept_data.iloc[0]['ingreso_per_capita']),
                    'alfabetizacion': float(dept_data.iloc[0]['prop_alfabeta'] * 100),
                    'personas_promedio': float(dept_data.iloc[0]['num_personas'])
                })
            else:
                feature['properties'].update({
                    'departamento': dept_name,
                    'vulnerabilidad': 0,
                    'ingreso_per_capita': 0,
                    'alfabetizacion': 0,
                    'personas_promedio': 0
                })
        
        features_with_data.append(feature)
    
    return jsonify({
        "type": "FeatureCollection", 
        "features": features_with_data
    })

@app.route('/api/analisis-clusters')
def analisis_clusters():
    if processor.vulnerabilidad_data is None:
        return jsonify({"error": "Datos no disponibles"})
    
    data = processor.vulnerabilidad_data
    
    cluster_analysis = []
    for cluster in sorted(data['cluster'].unique()):
        cluster_data = data[data['cluster'] == cluster]
        
        vuln_avg = float(cluster_data['indice_vulnerabilidad'].mean())
        ing_avg = float(cluster_data['ingreso_per_capita'].mean())
        alf_avg = float(cluster_data['prop_alfabeta'].mean() * 100)
        pers_avg = float(cluster_data['num_personas'].mean())
        educ_avg = float(cluster_data['educacion_promedio'].mean())
        
        if vuln_avg > 0.15:
            descripcion = "Hogares en alta vulnerabilidad"
            caracteristicas = [
                f"Vulnerabilidad: {vuln_avg:.1%}",
                f"Ingresos limitados: Bs {ing_avg:.0f}",
                f"Alfabetización: {alf_avg:.1f}%",
                f"Familias numerosas: {pers_avg:.1f} personas"
            ]
        elif vuln_avg > 0:
            descripcion = "Hogares en vulnerabilidad moderada"
            caracteristicas = [
                f"Vulnerabilidad media: {vuln_avg:.1%}",
                f"Ingresos regulares: Bs {ing_avg:.0f}",
                f"Alfabetización: {alf_avg:.1f}%",
                f"Tamaño familiar: {pers_avg:.1f} personas"
            ]
        else:
            descripcion = "Hogares estables"
            caracteristicas = [
                f"Baja vulnerabilidad: {abs(vuln_avg):.1%}",
                f"Ingresos estables: Bs {ing_avg:.0f}",
                f"Alta alfabetización: {alf_avg:.1f}%",
                f"Familias pequeñas: {pers_avg:.1f} personas"
            ]
        
        cluster_info = {
            "cluster_id": int(cluster),
            "total_hogares": len(cluster_data),
            "vulnerabilidad_promedio": vuln_avg,
            "ingreso_promedio": ing_avg,
            "alfabetizacion": alf_avg,
            "personas_promedio": pers_avg,
            "educacion_promedio": educ_avg,
            "descripcion": descripcion,
            "caracteristicas": caracteristicas
        }
        
        cluster_analysis.append(cluster_info)
    
    return jsonify(cluster_analysis)

@app.route('/api/comparacion-departamentos')
def comparacion_departamentos():
    if processor.departamentos_data is None:
        return jsonify({"error": "Datos no disponibles"})
    
    data = processor.departamentos_data.copy()
    
    data['ranking_vulnerabilidad'] = data['indice_vulnerabilidad'].rank(ascending=False)
    data['ranking_ingreso'] = data['ingreso_per_capita'].rank(ascending=False)
    data['ranking_educacion'] = data['prop_alfabeta'].rank(ascending=False)
    
    comparacion = data.to_dict('records')
    
    return jsonify(comparacion)

@app.route('/api/recomendaciones')
def generar_recomendaciones():
    if processor.departamentos_data is None or processor.vulnerabilidad_data is None:
        return jsonify({"error": "Datos no disponibles"})
    
    dept_data = processor.departamentos_data.copy()
    hogares_data = processor.vulnerabilidad_data.copy()
    
    dept_criticos = dept_data[dept_data['indice_vulnerabilidad'] > 0.15].sort_values('indice_vulnerabilidad', ascending=False)
    dept_moderados = dept_data[(dept_data['indice_vulnerabilidad'] > 0.05) & (dept_data['indice_vulnerabilidad'] <= 0.15)]
    dept_estables = dept_data[dept_data['indice_vulnerabilidad'] <= 0.05]
    
    hogares_criticos = len(hogares_data[hogares_data['nivel_vulnerabilidad'].isin(['Alto', 'Muy Alto'])])
    hogares_moderados = len(hogares_data[hogares_data['nivel_vulnerabilidad'] == 'Medio'])
    
    recomendaciones = []
    
    if len(dept_criticos) > 0:
        areas_criticas = ', '.join(dept_criticos.head(3)['departamento'].tolist())
        presupuesto_critico = int(hogares_criticos * 1500)
        recomendaciones.append({
            "prioridad": "Alta",
            "area": areas_criticas,
            "accion": "Implementar programas de transferencias monetarias condicionadas",
            "presupuesto": f"Bs {presupuesto_critico:,}",
            "plazo": "6 meses",
            "impacto": f"{hogares_criticos:,} hogares"
        })
    
    if len(dept_moderados) > 0:
        areas_moderadas = ', '.join(dept_moderados.head(3)['departamento'].tolist())
        presupuesto_moderado = int(hogares_moderados * 800)
        recomendaciones.append({
            "prioridad": "Media",
            "area": areas_moderadas,
            "accion": "Programas de capacitación laboral y microcréditos",
            "presupuesto": f"Bs {presupuesto_moderado:,}",
            "plazo": "12 meses",
            "impacto": f"{hogares_moderados:,} hogares"
        })
    
    recomendaciones.append({
        "prioridad": "Media",
        "area": "Todas las regiones",
        "accion": "Fortalecimiento del sistema de monitoreo social",
        "presupuesto": f"Bs {int(len(hogares_data) * 50):,}",
        "plazo": "18 meses",
        "impacto": "Nacional"
    })
    
    return jsonify(recomendaciones)

@app.route('/api/indicadores-clave')
def indicadores_clave():
    if processor.vulnerabilidad_data is None:
        return jsonify({"error": "Datos no disponibles"})
    
    data = processor.vulnerabilidad_data
    
    hogares_extremos = len(data[data['nivel_vulnerabilidad'] == 'Muy Alto'])
    distribución = data['nivel_vulnerabilidad'].value_counts().to_dict()
    hogares_alta_vuln = distribución.get('Alto', 0) + distribución.get('Muy Alto', 0)
    porcentaje_vulnerable = (hogares_alta_vuln / len(data)) * 100
    ingreso_promedio = float(data['ingreso_per_capita'].mean())
    cobertura_alfabeta = float(data['prop_alfabeta'].mean() * 100)
    
    indicadores = [
        {
            "indicador": "Hogares en vulnerabilidad extrema",
            "valor": f"{hogares_extremos:,}",
            "meta": f"<{int(hogares_extremos * 0.5):,}",
            "color": "text-red-600" if hogares_extremos > 2000 else "text-yellow-600"
        },
        {
            "indicador": "Índice de vulnerabilidad promedio",
            "valor": f"{porcentaje_vulnerable:.1f}%",
            "meta": "<15%",
            "color": "text-orange-600" if porcentaje_vulnerable > 30 else "text-green-600"
        },
        {
            "indicador": "Ingreso per cápita promedio",
            "valor": f"Bs {ingreso_promedio:,.0f}",
            "meta": "Bs 1,500",
            "color": "text-yellow-600" if ingreso_promedio < 1000 else "text-green-600"
        },
        {
            "indicador": "Alfabetización promedio",
            "valor": f"{cobertura_alfabeta:.1f}%",
            "meta": "95%",
            "color": "text-blue-600" if cobertura_alfabeta < 90 else "text-green-600"
        }
    ]
    
    return jsonify(indicadores)

@app.route('/api/rangos-indicadores')
def get_rangos_indicadores():
    """Obtiene rangos dinámicos para todos los indicadores"""
    try:
        processor = DataProcessor()
        
        if processor.departamentos_data is None:
            return jsonify({'error': 'No se pudieron cargar los datos'}), 500
            
        # Calcular rangos para vulnerabilidad
        vuln_min = processor.departamentos_data['indice_vulnerabilidad'].min()
        vuln_max = processor.departamentos_data['indice_vulnerabilidad'].max()
        vuln_range = vuln_max - vuln_min
        
        # Calcular rangos para ingreso
        ingreso_min = processor.departamentos_data['ingreso_per_capita'].min()
        ingreso_max = processor.departamentos_data['ingreso_per_capita'].max()
        ingreso_range = ingreso_max - ingreso_min
        
        # Calcular rangos para alfabetización
        alfa_min = processor.departamentos_data['prop_alfabeta'].min()
        alfa_max = processor.departamentos_data['prop_alfabeta'].max()
        alfa_range = alfa_max - alfa_min
        
        return jsonify({
            'vulnerabilidad': {
                'muy_alto': vuln_min + vuln_range * 0.75,
                'alto': vuln_min + vuln_range * 0.5,
                'medio': vuln_min + vuln_range * 0.25,
                'bajo': vuln_min
            },
            'ingreso_per_capita': {
                'alto': ingreso_min + ingreso_range * 0.75,
                'medio': ingreso_min + ingreso_range * 0.25,
                'bajo': ingreso_min
            },
            'alfabetizacion': {
                'alto': alfa_min + alfa_range * 0.75,
                'medio': alfa_min + alfa_range * 0.25,
                'bajo': alfa_min
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/departamentos-prioritarios')
def departamentos_prioritarios():
    if processor.departamentos_data is None:
        return jsonify({"error": "Datos no disponibles"})
    
    data = processor.departamentos_data.copy()
    umbral_critico = 0.05  # umbral para alta vulnerabilidad
    departamentos_criticos = data.nlargest(4, 'indice_vulnerabilidad')
    count_criticos = len(data[data['indice_vulnerabilidad'] > umbral_critico])
    
    return jsonify({
        "departamentos_criticos": departamentos_criticos['departamento'].tolist(),
        "count_criticos": count_criticos,
        "porcentaje_vulnerables": count_criticos / len(data) * 100
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)