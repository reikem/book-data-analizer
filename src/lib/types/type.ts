// Tipos base para todo el proyecto

export interface SociedadMapping {
  codigo: string
  sociedad: string
}

// Permite acceder por índice sin chocar con campos opcionales
export interface ProcessedDataRow {
  [key: string]: string | number | boolean | null | undefined
  _source: string
  SociedadCodigo: string
  SociedadNombre: string
  MontoEstandarizado?: number
  LibroMayor?: string
  RelatedRecords?: number
  RelatedSources?: string
}

export interface ProcessedData {
  unifiedData: ProcessedDataRow[]
  sociedadMappings: SociedadMapping[]
}

export interface FileData {
  name: string
  data: Record<string, unknown>[]
}

export interface ChartData {
  name: string
  value: number
  [key: string]: string | number
}

// --------- CHARTS ----------
export type ChartType = "line" | "bar" | "kpi" | "profitability"

export interface ChartConfig {
  id: string
  type: ChartType
  title: string
  xAxis: string
  yAxis: string
  description: string
  // opcionales si en alguna parte se utilizan
  chartType?: "line" | "bar" | "area" | "pie"
  xField?: string
  yField?: string
  position?: number
}

// Widgets personalizados que puedas guardar en el store
export interface CustomWidget {
  id: string
  type: "chart" | "kpi" | "table"
  title: string
  description: string
  chartType?: "line" | "bar" | "area" | "pie"
  xField?: string
  yField?: string
  position: number
}

// Chat
export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  isLoading?: boolean
}

// Exportaciones
export interface ExportOptions {
  format: "pdf" | "pptx" | "xlsx"
  includeCharts: boolean
  includeData: boolean
  /** En varios sitios se asume que siempre existe */
  title: string
  /** Algunas utilidades esperan esta bandera */
  includeTable?: boolean
}

// Dashboard (si lo necesitas como tipo)
export interface DashboardWidget {
  id: string
  type: "chart" | "kpi" | "table"
  title: string
  data: ChartData[]
  chartType?: "line" | "bar" | "area" | "pie"
  position: { x: number; y: number; w: number; h: number }
}
