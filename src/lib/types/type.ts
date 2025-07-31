export interface SociedadMapping {
    codigo: string
    sociedad: string
  }
  
  export interface ProcessedDataRow {
    [key: string]: string | number | boolean
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
  
  export interface ChartConfig {
    id: string
    type: string
    title: string
    xAxis: string
    yAxis: string
    description: string
    chartType?: "line" | "bar" | "area" | "pie"
    xField?: string
    yField?: string
    position?: number
  }
  
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
  
  export interface ChatMessage {
    id: string
    role: "user" | "assistant"
    content: string
    timestamp: Date
    isLoading?: boolean
  }
  
  export interface ExportOptions {
    format: "pdf" | "pptx" | "xlsx"
    includeCharts: boolean
    includeData: boolean
    title?: string
  }
  
  export interface DashboardWidget {
    id: string
    type: "chart" | "kpi" | "table"
    title: string
    data: ChartData[]
    chartType?: "line" | "bar" | "area" | "pie"
    position: { x: number; y: number; w: number; h: number }
  }
  