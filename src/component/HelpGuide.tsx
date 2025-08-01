
import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  ChevronDown,
  Upload,
  BarChart3,
  MessageSquare,
  FileText,
  Settings,
  Table,
  PieChart,
  TrendingUp,
  Download,
} from "lucide-react"

interface GuideSection {
  id: string
  title: string
  icon: React.ReactNode
  description: string
  steps: Array<{
    title: string
    description: string
    tips?: string[]
  }>
}

const guideData: GuideSection[] = [
  {
    id: "upload",
    title: "Cargar Datos",
    icon: <Upload className="h-5 w-5" />,
    description: "Aprende a subir y procesar archivos CSV",
    steps: [
      {
        title: "Seleccionar archivos",
        description: "Haz clic en 'Cargar Datos' y selecciona uno o más archivos CSV desde tu computadora.",
        tips: [
          "Los archivos deben estar en formato CSV",
          "Asegúrate de que tengan encabezados en la primera fila",
          "Puedes cargar múltiples archivos a la vez",
        ],
      },
      {
        title: "Verificar formato",
        description: "El sistema procesará automáticamente los archivos y mostrará una vista previa.",
        tips: [
          "Revisa que las columnas se hayan detectado correctamente",
          "Verifica que los datos numéricos se muestren sin errores",
          "Si hay problemas, revisa el formato del archivo original",
        ],
      },
      {
        title: "Confirmar carga",
        description: "Una vez verificados los datos, confirma la carga para comenzar el análisis.",
        tips: [
          "Los datos se procesarán y unificarán automáticamente",
          "Se crearán relaciones entre archivos cuando sea posible",
          "Podrás ver el resumen de datos cargados",
        ],
      },
    ],
  },
  {
    id: "dashboard",
    title: "Dashboard",
    icon: <BarChart3 className="h-5 w-5" />,
    description: "Visualiza métricas clave y KPIs",
    steps: [
      {
        title: "Métricas principales",
        description: "El dashboard muestra automáticamente las métricas más importantes de tus datos.",
        tips: [
          "Total de registros procesados",
          "Monto total y promedio",
          "Número de empresas únicas",
          "Distribución por fuentes de datos",
        ],
      },
      {
        title: "Gráficos interactivos",
        description: "Explora los diferentes tipos de visualizaciones disponibles.",
        tips: [
          "Gráfico de tendencias mensuales",
          "Top empresas por monto",
          "Distribución por fuentes",
          "Tabla de datos recientes",
        ],
      },
      {
        title: "Personalización",
        description: "Puedes editar los títulos de los widgets haciendo clic en ellos.",
        tips: [
          "Haz clic en cualquier título para editarlo",
          "Presiona Enter o haz clic fuera para guardar",
          "Los cambios se mantienen durante la sesión",
        ],
      },
    ],
  },
  {
    id: "charts",
    title: "Generar Gráficos",
    icon: <PieChart className="h-5 w-5" />,
    description: "Crea visualizaciones personalizadas",
    steps: [
      {
        title: "Seleccionar tipo de gráfico",
        description: "Elige entre diferentes tipos de visualizaciones según tus necesidades.",
        tips: [
          "Gráfico de barras para comparaciones",
          "Gráfico de líneas para tendencias",
          "Gráfico circular para proporciones",
          "Mapa de calor para correlaciones",
        ],
      },
      {
        title: "Configurar ejes",
        description: "Selecciona las columnas para los ejes X e Y de tu gráfico.",
        tips: [
          "Eje X: generalmente categorías o tiempo",
          "Eje Y: valores numéricos a medir",
          "Puedes usar campos calculados como MontoEstandarizado",
        ],
      },
      {
        title: "Personalizar apariencia",
        description: "Ajusta título, descripción y otros elementos visuales.",
        tips: [
          "Usa títulos descriptivos y claros",
          "Agrega descripciones para contexto",
          "Los gráficos se actualizan automáticamente con filtros",
        ],
      },
    ],
  },
  {
    id: "table",
    title: "Tabla de Datos",
    icon: <Table className="h-5 w-5" />,
    description: "Explora y filtra datos en detalle",
    steps: [
      {
        title: "Navegación básica",
        description: "Usa los controles de paginación y búsqueda para explorar los datos.",
        tips: [
          "Barra de búsqueda para filtrar registros",
          "Selector de filas por página (25, 50, 100, 200)",
          "Navegación por páginas en la parte inferior",
        ],
      },
      {
        title: "Ordenamiento",
        description: "Haz clic en los encabezados de columna para ordenar los datos.",
        tips: [
          "Primer clic: orden ascendente",
          "Segundo clic: orden descendente",
          "Tercer clic: sin ordenamiento",
          "Funciona con datos numéricos y texto",
        ],
      },
      {
        title: "Gestión de columnas",
        description: "Controla qué columnas mostrar u ocultar según tus necesidades.",
        tips: [
          "Usa el botón 'Columnas' para mostrar/ocultar",
          "Útil para enfocarse en datos específicos",
          "Exporta solo las columnas visibles",
        ],
      },
    ],
  },
  {
    id: "chat",
    title: "Asistente IA",
    icon: <MessageSquare className="h-5 w-5" />,
    description: "Haz preguntas inteligentes sobre tus datos",
    steps: [
      {
        title: "Hacer preguntas",
        description: "Escribe preguntas en lenguaje natural sobre tus datos.",
        tips: [
          "Ejemplos: '¿Cuál es el total por empresa?'",
          "'Muestra las tendencias mensuales'",
          "'¿Qué empresa tiene más registros?'",
        ],
      },
      {
        title: "Análisis contextual",
        description: "El asistente considera los filtros y selecciones actuales.",
        tips: [
          "Filtra por empresas antes de preguntar",
          "El análisis se basa en datos visibles",
          "Puedes hacer preguntas de seguimiento",
        ],
      },
      {
        title: "Límites de uso",
        description: "Tienes un límite de preguntas por sesión para optimizar el rendimiento.",
        tips: [
          "Máximo 3 preguntas por sesión",
          "Reinicia la sesión para más preguntas",
          "Usa preguntas específicas y claras",
        ],
      },
    ],
  },
  {
    id: "reports",
    title: "Generar Informes",
    icon: <FileText className="h-5 w-5" />,
    description: "Crea reportes en PDF y PowerPoint",
    steps: [
      {
        title: "Configurar informe",
        description: "Selecciona qué elementos incluir en tu informe.",
        tips: ["Incluir gráficos generados", "Incluir tabla de datos", "Personalizar título del informe"],
      },
      {
        title: "Generar PDF",
        description: "Crea un informe completo en formato PDF.",
        tips: [
          "Incluye resumen ejecutivo automático",
          "Gráficos se capturan en alta resolución",
          "Tabla de datos de muestra incluida",
        ],
      },
      {
        title: "Generar PowerPoint",
        description: "Exporta a formato PPTX para presentaciones.",
        tips: ["Una diapositiva por gráfico", "Títulos y descripciones incluidos", "Formato compatible con PowerPoint"],
      },
    ],
  },
  {
    id: "companies",
    title: "Filtrar por Empresas",
    icon: <Settings className="h-5 w-5" />,
    description: "Filtra datos por sociedades específicas",
    steps: [
      {
        title: "Seleccionar empresas",
        description: "Usa el selector múltiple para elegir las empresas a analizar.",
        tips: [
          "Puedes seleccionar múltiples empresas",
          "Búsqueda por nombre o código",
          "Selección se aplica a todos los módulos",
        ],
      },
      {
        title: "Aplicar filtros",
        description: "Los filtros se aplican automáticamente a todas las visualizaciones.",
        tips: [
          "Dashboard se actualiza inmediatamente",
          "Gráficos muestran solo datos filtrados",
          "Tabla refleja la selección actual",
        ],
      },
      {
        title: "Limpiar filtros",
        description: "Puedes quitar empresas individualmente o limpiar toda la selección.",
        tips: [
          "Haz clic en la X de cada empresa",
          "Usa 'Limpiar selección' para quitar todas",
          "Sin selección = mostrar todas las empresas",
        ],
      },
    ],
  },
]

export function HelpGuide() {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set())

  const toggleSection = (sectionId: string) => {
    const newOpenSections = new Set(openSections)
    if (newOpenSections.has(sectionId)) {
      newOpenSections.delete(sectionId)
    } else {
      newOpenSections.add(sectionId)
    }
    setOpenSections(newOpenSections)
  }

  return (
    <div className="space-y-6" id="help-section">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-4">
          Guía de Ayuda
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Aprende a usar todas las funcionalidades de la plataforma de análisis de datos. Sigue estos pasos detallados
          para aprovechar al máximo tus datos.
        </p>
      </div>

      {/* Quick Start */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
            <TrendingUp className="h-5 w-5" />
            Inicio Rápido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-white font-bold">1</span>
              </div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Cargar Datos</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">Sube tus archivos CSV</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-white font-bold">2</span>
              </div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Explorar Dashboard</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">Ve métricas clave</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-white font-bold">3</span>
              </div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Generar Reportes</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">Crea informes PDF/PPT</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Guides */}
      <div className="space-y-4">
        {guideData.map((section) => (
          <Card
            key={section.id}
            className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-gray-200/50 dark:border-slate-700/50"
          >
            <Collapsible open={openSections.has(section.id)} onOpenChange={() => toggleSection(section.id)}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">{section.icon}</div>
                      <div>
                        <CardTitle className="text-lg text-gray-900 dark:text-gray-100">{section.title}</CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{section.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {section.steps.length} pasos
                      </Badge>
                      <ChevronDown
                        className={`h-5 w-5 transition-transform ${openSections.has(section.id) ? "rotate-180" : ""}`}
                      />
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="space-y-6">
                    {section.steps.map((step, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-semibold">{index + 1}</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{step.title}</h4>
                          <p className="text-gray-600 dark:text-gray-400 mb-3">{step.description}</p>
                          {step.tips && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                              <h5 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                                💡 Consejos útiles:
                              </h5>
                              <ul className="space-y-1">
                                {step.tips.map((tip, tipIndex) => (
                                  <li
                                    key={tipIndex}
                                    className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2"
                                  >
                                    <span className="text-blue-500 mt-1">•</span>
                                    <span>{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>

      {/* Support Section */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
            <MessageSquare className="h-5 w-5" />
            ¿Necesitas más ayuda?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-700 dark:text-green-300 mb-4">
            Si tienes preguntas específicas o encuentras algún problema, puedes:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
              <MessageSquare className="h-5 w-5 text-green-600" />
              <div>
                <h4 className="font-semibold text-green-900 dark:text-green-100">Usar el Asistente IA</h4>
                <p className="text-sm text-green-700 dark:text-green-300">Haz preguntas específicas sobre tus datos</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
              <Download className="h-5 w-5 text-green-600" />
              <div>
                <h4 className="font-semibold text-green-900 dark:text-green-100">Exportar Datos</h4>
                <p className="text-sm text-green-700 dark:text-green-300">Descarga tus análisis en PDF o Excel</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
