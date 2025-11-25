import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.express as px
import plotly.graph_objects as go
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.ensemble import RandomForestClassifier
from sklearn.decomposition import PCA
import warnings
warnings.filterwarnings('ignore')

class VulnerabilidadAnalyzer:
    def __init__(self):
        self.data = {}
        self.merged_data = None
        self.vulnerability_index = None
        self.cluster_results = None

    def _leer_csv(self, ruta):
        encodings = ['utf-8', 'latin1', 'iso-8859-1']
        for encoding in encodings:
            try:
                return pd.read_csv(
                    ruta,
                    encoding=encoding,
                    engine='python',
                    sep=None,
                    on_bad_lines='skip'
                )
            except UnicodeDecodeError:
                continue
            except pd.errors.ParserError:
                continue
        raise ValueError("No fue posible leer el archivo con los formatos soportados")

    @staticmethod
    def _seleccionar_columna(df, candidatos):
        for columna in candidatos:
            if columna in df.columns:
                return columna
        return None

    @staticmethod
    def _serie_numerica(df, columna):
        if columna is None or columna not in df.columns:
            return None
        serie = df[columna]
        if pd.api.types.is_numeric_dtype(serie):
            return serie
        extraida = serie.astype(str).str.extract(r'([-+]?\d*\.?\d+)')[0]
        return pd.to_numeric(extraida, errors='coerce')
        
    def cargar_datos(self):
        """Cargar todos los archivos CSV de la encuesta EH2019"""
        base_path = "../Base EH2019/"
        
        archivos = {
            'personas': 'EH2019_Persona/EH2019_Pers_csv.csv',
            'viviendas': 'EH2019_Vivienda/EH2019_Vivienda.csv',
            'gastos_alimentarios': 'EH2019_GastosAlimentarios/EH2019_GastosAlimentarios.csv',
            'gastos_no_alimentarios': 'EH2019_GastosNoAlimentarios/EH2019_GastosNoAlimentarios.csv',
            'equipamiento': 'EH2019_Equipamiento/EH2019_Equipamiento.csv',
            'seguridad_alimentaria': 'EH2019_SeguridadAlimentaria/EH2019_SeguridadAlimentaria.csv',
            'discriminacion': 'EH2019_Discriminacion/EH2019_Discriminacion.csv'
        }
        
        print("Cargando datos de la Encuesta de Hogares 2019...")
        for nombre, archivo in archivos.items():
            try:
                df = self._leer_csv(f"{base_path}{archivo}")
                self.data[nombre] = df
                print(f"{nombre}: {df.shape[0]:,} registros, {df.shape[1]} variables")
            except Exception as e:
                print(f"✗ Error cargando {nombre}: {e}")
                
    def explorar_datos(self):
        """Exploración inicial de los datos"""
        print("\n" + "="*60)
        print("EXPLORACIÓN DE DATOS - ENCUESTA DE HOGARES 2019")
        print("="*60)
        
        for nombre, df in self.data.items():
            print(f"\n{nombre.upper()}:")
            print(f"Dimensiones: {df.shape}")
            print(f"Variables principales: {list(df.columns[:10])}")
            print(f"Valores faltantes: {df.isnull().sum().sum()}")
            
    def crear_indice_vulnerabilidad(self):
        """Crear índice de vulnerabilidad socioeconómica"""
        print("\nCreando Índice de Vulnerabilidad Socioeconómica...")

        requeridos = ['personas', 'viviendas', 'gastos_alimentarios', 'gastos_no_alimentarios']
        faltantes = [r for r in requeridos if r not in self.data]
        if faltantes:
            raise ValueError(f"No se cargaron los datasets necesarios: {', '.join(faltantes)}")
        
        personas = self.data['personas'].copy()
        viviendas = self.data['viviendas'].copy()

        hogares_personas = personas.groupby('folio').size().rename('num_personas').to_frame()

        col_edad = self._seleccionar_columna(personas, ['s02a_04', 's02a_04a'])
        serie_edad = self._serie_numerica(personas, col_edad)
        hogares_personas['edad_promedio'] = serie_edad.groupby(personas['folio']).mean() if serie_edad is not None else np.nan

        serie_genero = self._serie_numerica(personas, 's02a_02')
        if serie_genero is not None:
            hogares_personas['prop_hombres'] = serie_genero.groupby(personas['folio']).apply(lambda x: (x == 1).mean())
        else:
            hogares_personas['prop_hombres'] = np.nan

        col_alfabeta = self._seleccionar_columna(personas, ['s03a_01', 's03a_01a', 's03a_02', 's03a_03'])
        serie_alfabeta = self._serie_numerica(personas, col_alfabeta)
        if serie_alfabeta is not None:
            hogares_personas['prop_alfabeta'] = serie_alfabeta.groupby(personas['folio']).apply(lambda x: (x == 1).mean())
        else:
            hogares_personas['prop_alfabeta'] = np.nan

        col_educacion = self._seleccionar_columna(personas, ['s03a_04', 's03a_04npioc', 's03a_05'])
        serie_educacion = self._serie_numerica(personas, col_educacion)
        hogares_personas['educacion_promedio'] = serie_educacion.groupby(personas['folio']).mean() if serie_educacion is not None else np.nan

        serie_ocupacion = self._serie_numerica(personas, 's05a_01')
        if serie_ocupacion is not None:
            hogares_personas['prop_ocupada'] = serie_ocupacion.groupby(personas['folio']).apply(lambda x: (x == 1).mean())
        else:
            hogares_personas['prop_ocupada'] = np.nan

        gastos_alim_df = self.data['gastos_alimentarios'].copy()
        col_gasto_alim = self._seleccionar_columna(gastos_alim_df, ['gasto', 'monto', 's10a_05'])
        if col_gasto_alim:
            gastos_alim_series = pd.to_numeric(gastos_alim_df[col_gasto_alim], errors='coerce')
            gastos_alim = gastos_alim_df.assign(_monto=gastos_alim_series).groupby('folio')['_monto'].sum()
        else:
            gastos_alim = pd.Series(dtype=float)

        gastos_no_df = self.data['gastos_no_alimentarios'].copy()
        col_gasto_no = self._seleccionar_columna(gastos_no_df, ['gasto', 'monto'])
        if col_gasto_no:
            gastos_no_series = pd.to_numeric(gastos_no_df[col_gasto_no], errors='coerce')
            gastos_no_alim = gastos_no_df.assign(_monto=gastos_no_series).groupby('folio')['_monto'].sum()
        else:
            cols_no = [c for c in gastos_no_df.columns if c.startswith('s10b_')]
            if cols_no:
                matriz_no = gastos_no_df[cols_no].apply(pd.to_numeric, errors='coerce')
                gastos_no_df['_monto'] = matriz_no.sum(axis=1)
                gastos_no_alim = gastos_no_df.groupby('folio')['_monto'].sum()
            else:
                gastos_no_alim = pd.Series(dtype=float)
        
        vulnerabilidad_df = hogares_personas.copy()
        vulnerabilidad_df['gastos_alimentarios'] = gastos_alim.reindex(vulnerabilidad_df.index).fillna(0)
        vulnerabilidad_df['gastos_no_alimentarios'] = gastos_no_alim.reindex(vulnerabilidad_df.index).fillna(0)
        vulnerabilidad_df['gastos_totales'] = vulnerabilidad_df['gastos_alimentarios'] + vulnerabilidad_df['gastos_no_alimentarios']
        
        columnas_vivienda = [c for c in ['s01a_09', 's01a_11', 's01b_01', 's01b_02'] if c in viviendas.columns]
        if columnas_vivienda:
            vivienda_vars = viviendas.set_index('folio')[columnas_vivienda].fillna(0)
            vulnerabilidad_df = vulnerabilidad_df.join(vivienda_vars, how='left')

        vulnerabilidad_df = vulnerabilidad_df.fillna(0)
        
        num_personas_seguro = vulnerabilidad_df['num_personas'].replace(0, np.nan)
        vulnerabilidad_df['ingreso_per_capita'] = (vulnerabilidad_df['gastos_totales'] / num_personas_seguro).fillna(0)
        vulnerabilidad_df['dependencia_economica'] = ((vulnerabilidad_df['num_personas'] - vulnerabilidad_df['num_personas'] * vulnerabilidad_df['prop_ocupada']) / num_personas_seguro).fillna(0)
        vulnerabilidad_df['inseguridad_educativa'] = (1 - vulnerabilidad_df['prop_alfabeta']).clip(lower=0)
        
        scaler = StandardScaler()
        variables_vulnerabilidad = ['ingreso_per_capita', 'dependencia_economica', 'inseguridad_educativa', 'educacion_promedio']
        
        vulnerabilidad_norm = scaler.fit_transform(vulnerabilidad_df[variables_vulnerabilidad])
        
        pesos = np.array([-0.4, 0.3, 0.2, -0.1])
        vulnerabilidad_df['indice_vulnerabilidad'] = np.dot(vulnerabilidad_norm, pesos)
        
        vulnerabilidad_df['nivel_vulnerabilidad'] = pd.cut(
            vulnerabilidad_df['indice_vulnerabilidad'],
            bins=[-np.inf, -0.5, 0, 0.5, np.inf],
            labels=['Bajo', 'Medio', 'Alto', 'Muy Alto']
        )
        
        self.vulnerability_index = vulnerabilidad_df
        print(f"Índice creado para {len(vulnerabilidad_df)} hogares")
        
    def clustering_hogares(self):
        """Clustering de hogares para identificar patrones de vulnerabilidad"""
        print("\nEjecutando clustering para identificar tipologías...")
        
        features = ['num_personas', 'edad_promedio', 'prop_alfabeta', 'educacion_promedio', 
                   'prop_ocupada', 'ingreso_per_capita', 'dependencia_economica']
        
        X = self.vulnerability_index[features].fillna(0)
        
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        # K-means clustering
        kmeans = KMeans(n_clusters=5, random_state=42, n_init=10)
        clusters = kmeans.fit_predict(X_scaled)
        
        self.vulnerability_index['cluster'] = clusters
        
        # Caracterizar clusters
        cluster_profiles = self.vulnerability_index.groupby('cluster').agg({
            'num_personas': 'mean',
            'ingreso_per_capita': 'mean',
            'prop_alfabeta': 'mean',
            'educacion_promedio': 'mean',
            'indice_vulnerabilidad': 'mean',
            'nivel_vulnerabilidad': lambda x: x.mode()[0] if not x.empty else 'Sin datos'
        }).round(2)
        
        print("Perfiles de clusters identificados:")
        print(cluster_profiles)
        
        self.cluster_results = cluster_profiles
        
    def analisis_departamental(self):
        """Análisis por departamento"""
        print("\nAnálisis por departamento...")
        
        # Mapeo de códigos de departamento
        dept_mapping = {
            1: 'Chuquisaca', 2: 'La Paz', 3: 'Cochabamba',
            4: 'Oruro', 5: 'Potosí', 6: 'Tarija',
            7: 'Santa Cruz', 8: 'Beni', 9: 'Pando'
        }
        
        viviendas = self.data['viviendas'].copy()
        dept_info = viviendas.set_index('folio')[['depto']].copy()

        def normalizar_depto(valor):
            if pd.isna(valor):
                return np.nan
            valor_str = str(valor).strip()
            digitos = ''.join(ch for ch in valor_str if ch.isdigit())
            if digitos:
                codigo = int(digitos)
                return dept_mapping.get(codigo, valor_str)
            return valor_str

        dept_info['departamento'] = dept_info['depto'].apply(normalizar_depto)
        
        self.vulnerability_index = self.vulnerability_index.join(dept_info, how='left')
        
        stats_dept = self.vulnerability_index.groupby('departamento').agg({
            'indice_vulnerabilidad': ['mean', 'std', 'count'],
            'ingreso_per_capita': 'mean',
            'prop_alfabeta': 'mean',
            'num_personas': 'mean'
        }).round(2)
        
        print("Estadísticas por departamento:")
        print(stats_dept)
        
        return stats_dept
        
    def exportar_resultados(self):
        """Exportar resultados para el dashboard"""
        print("\nExportando resultados...")
        
        resumen = {
            'total_hogares': len(self.vulnerability_index),
            'vulnerabilidad_promedio': self.vulnerability_index['indice_vulnerabilidad'].mean(),
            'distribucion_vulnerabilidad': self.vulnerability_index['nivel_vulnerabilidad'].value_counts().to_dict(),
            'ingreso_promedio': self.vulnerability_index['ingreso_per_capita'].mean(),
        }
        
        self.vulnerability_index.to_csv('vulnerabilidad_hogares.csv', index=True)
        
        dept_summary = self.vulnerability_index.groupby('departamento').agg({
            'indice_vulnerabilidad': 'mean',
            'ingreso_per_capita': 'mean',
            'prop_alfabeta': 'mean',
            'num_personas': 'mean'
        }).reset_index()
        
        dept_summary.to_csv('vulnerabilidad_departamentos.csv', index=False)
        
        print("Archivos exportados: vulnerabilidad_hogares.csv, vulnerabilidad_departamentos.csv")
        
        return resumen, dept_summary
        
    def generar_visualizaciones(self):
        """Generar gráficos de análisis"""
        print("\nGenerando visualizaciones...")
        
        # 1. Distribución de vulnerabilidad
        plt.figure(figsize=(12, 8))
        
        plt.subplot(2, 2, 1)
        self.vulnerability_index['nivel_vulnerabilidad'].value_counts().plot(kind='bar')
        plt.title('Distribución de Niveles de Vulnerabilidad')
        plt.xticks(rotation=45)
        
        # 2. Vulnerabilidad por departamento
        plt.subplot(2, 2, 2)
        plt.subplot(2, 2, 2)
        dept_vuln = self.vulnerability_index.groupby('departamento')['indice_vulnerabilidad'].mean().sort_values()
        if dept_vuln.empty:
            plt.axis('off')
            plt.title('Sin datos departamentales disponibles')
        else:
            dept_vuln.plot(kind='barh')
            plt.title('Índice de Vulnerabilidad por Departamento')
        
        # 3. Correlaciones
        plt.subplot(2, 2, 3)
        corr_vars = ['indice_vulnerabilidad', 'ingreso_per_capita', 'prop_alfabeta', 'educacion_promedio']
        corr_matrix = self.vulnerability_index[corr_vars].corr()
        sns.heatmap(corr_matrix, annot=True, cmap='RdYlBu_r', center=0)
        plt.title('Correlaciones entre Variables')
        
        # 4. Clusters
        plt.subplot(2, 2, 4)
        cluster_counts = self.vulnerability_index['cluster'].value_counts().sort_index()
        cluster_counts.plot(kind='bar')
        plt.title('Distribución de Clusters')
        
        plt.tight_layout()
        plt.savefig('analisis_vulnerabilidad.png', dpi=300, bbox_inches='tight')
        plt.show()
        
def main():
    print("ANÁLISIS DE VULNERABILIDAD SOCIOECONÓMICA EN BOLIVIA")
    print("Encuesta de Hogares 2019 - Big Data Analytics")
    print("="*60)
    
    analyzer = VulnerabilidadAnalyzer()
    
    analyzer.cargar_datos()
    analyzer.explorar_datos()
    analyzer.crear_indice_vulnerabilidad()
    analyzer.clustering_hogares()
    dept_stats = analyzer.analisis_departamental()
    resumen, dept_data = analyzer.exportar_resultados()
    analyzer.generar_visualizaciones()
    
    print("\n" + "="*60)
    print("RESUMEN")
    print("="*60)
    print(f"Total de hogares analizados: {resumen['total_hogares']:,}")
    print(f"Índice de vulnerabilidad promedio: {resumen['vulnerabilidad_promedio']:.3f}")
    print(f"Ingreso per cápita promedio: Bs. {resumen['ingreso_promedio']:,.0f}")
    print("\nDistribución de vulnerabilidad:")
    for nivel, cantidad in resumen['distribucion_vulnerabilidad'].items():
        print(f"  {nivel}: {cantidad:,} hogares ({cantidad/resumen['total_hogares']*100:.1f}%)")
    
    print("\nAnálisis completado exitosamente")
    print("Archivos generados listos para el dashboard")

if __name__ == "__main__":
    main()