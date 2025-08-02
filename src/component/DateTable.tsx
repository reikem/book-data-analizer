import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  Columns,
  ChevronLeft,
  ChevronRight,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react"
import { useDataStore } from "@/lib/store"
import type { ProcessedDataRow } from "@/lib/types/type"
import { useToast } from "@/hook/useToast"

type SortDirection = "asc" | "desc" | null
type Severity = "error" | "warning"

type CellIssue = {
  column: string
  message: string
  severity: Severity
}

type ColumnStat = {
  issues: number
  ratio: number // issues / totalRows
}

type Verification = {
  byIndex: Record<number, CellIssue[]>
  rowsWithIssues: number
  errors: number
  warnings: number
  missingRequired: number
  duplicates: number
  outliers: number
  invalidNumbers: number
  crossField: number
  monthlyAnomalies: number
  companyIqrAnomalies: number
  columnStats: Record<string, ColumnStat>
  hotColumns: string[]
}

interface TableQueryResult {
  data: ProcessedDataRow[]
  totalCount: number
  indexMap: number[]
  verification: Verification
}

/* =================== Reglas configurables =================== */
const REQUIRED_COLUMNS: Array<keyof ProcessedDataRow> = ["SociedadNombre", "SociedadCodigo", "_source"]

// Umbral absoluto de outlier
const OUTLIER_THRESHOLD_ABS = 1e10

// Palabras clave para cruce con LibroMayor
const POSITIVE_EXPECTED = ["gasto", "compr", "cost", "egreso"] // si es positivo está ok; si es negativo -> warning
const NON_NEGATIVE_EXPECTED = ["venta", "ingres", "factur"] // si es negativo -> error

// Posibles nombres de columna fecha (se toma la primera que encaje y pueda parsearse)
const DATE_CANDIDATES = ["Fecha", "fecha", "Date", "date", "Periodo", "periodo"]

// Hotspot: % mínimo de filas con issue en una columna para resaltarla
const HOT_COLUMN_RATIO = 0.1

/* =================== Utilidades estadísticas =================== */
function numeric(val: unknown): number | null {
  if (typeof val === "number" && Number.isFinite(val)) return val
  const n = Number(val)
  return Number.isFinite(n) ? n : null
}

function quantiles(sorted: number[]) {
  const q = (p: number) => {
    if (sorted.length === 0) return 0
    const idx = (sorted.length - 1) * p
    const lo = Math.floor(idx)
    const hi = Math.ceil(idx)
    if (lo === hi) return sorted[lo]
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
  }
  return { q1: q(0.25), q3: q(0.75) }
}

function mean(arr: number[]) {
  if (arr.length === 0) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}
function stdev(arr: number[]) {
  if (arr.length < 2) return 0
  const m = mean(arr)
  const v = mean(arr.map((x) => (x - m) ** 2))
  return Math.sqrt(v)
}

/* =================== Detección de fecha y clave mensual =================== */
function detectDateKey(row: ProcessedDataRow): string | null {
  for (const k of DATE_CANDIDATES) {
    if (k in row) {
      const v = row[k as keyof ProcessedDataRow]
      const d = new Date(String(v))
      if (!isNaN(d.getTime())) return k
    }
  }
  // fallback: intentar la primera columna que parezca fecha
  for (const k in row) {
    const v = row[k]
    if (typeof v === "string" && /\d{4}-\d{1,2}-\d{1,2}/.test(v)) {
      const d = new Date(v)
      if (!isNaN(d.getTime())) return k
    }
  }
  return null
}

function monthKey(v: unknown): string | null {
  const d = new Date(String(v))
  if (isNaN(d.getTime())) return null
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

/* =================== Verificación principal =================== */
function verifyData(rows: ProcessedDataRow[], originalIndexMap: number[]): Verification {
  const byIndex: Record<number, CellIssue[]> = {}
  const colIssueCounter: Record<string, number> = {}

  let errors = 0
  let warnings = 0
  let missingRequired = 0
  let duplicates = 0
  let outliers = 0
  let invalidNumbers = 0
  let crossField = 0
  let monthlyAnomalies = 0
  let companyIqrAnomalies = 0

  const addIssue = (originalIdx: number, issue: CellIssue) => {
    if (!byIndex[originalIdx]) byIndex[originalIdx] = []
    byIndex[originalIdx].push(issue)
    if (issue.severity === "error") errors++
    else warnings++
    // contador por columna
    colIssueCounter[issue.column] = (colIssueCounter[issue.column] || 0) + 1
  }

  const seen = new Set<string>()
  const companyMap = new Map<string, number[]>() // para IQR por empresa
  const monthCompanyMap = new Map<string, number[]>() // para z-score mensual por empresa

  // Detectar posible columna de fecha (si existe)
  const dateKey = rows.length ? detectDateKey(rows[0]) : null

  // 1) Primera pasada: validar requeridos, números, duplicados y recolectar para stats
  rows.forEach((row, pos) => {
    const originalIdx = originalIndexMap[pos]

    // Requeridos
    REQUIRED_COLUMNS.forEach((col) => {
      const v = row[col]
      if (v === null || v === undefined || String(v).trim() === "") {
        addIssue(originalIdx, { column: String(col), message: "Campo requerido vacío", severity: "error" })
        missingRequired++
      }
    })

    // Monto
    const amt = numeric(row.MontoEstandarizado)
    if (amt === null) {
      if (row.MontoEstandarizado !== undefined) {
        addIssue(originalIdx, {
          column: "MontoEstandarizado",
          message: "Monto inválido (no numérico o no finito)",
          severity: "error",
        })
        invalidNumbers++
      }
    } else {
      if (Math.abs(amt) > OUTLIER_THRESHOLD_ABS) {
        addIssue(originalIdx, {
          column: "MontoEstandarizado",
          message: "Posible outlier por magnitud absoluta",
          severity: "warning",
        })
        outliers++
      }
      // acumular para empresa
      const comp = String(row.SociedadNombre ?? row.SociedadCodigo ?? "N/A")
      companyMap.set(comp, [...(companyMap.get(comp) || []), amt])

      // acumular para mes/empresa si hay fecha
      if (dateKey) {
        const mk = monthKey(row[dateKey])
        if (mk) {
          const key = `${comp}__${mk}`
          monthCompanyMap.set(key, [...(monthCompanyMap.get(key) || []), amt])
        }
      }
    }

    // Duplicados
    const dupKey =
      `${String(row.SociedadCodigo ?? "")}|${String(row._source ?? "")}|${String(row.LibroMayor ?? "")}|` +
      `${String(row.SociedadNombre ?? "")}`
    if (dupKey.trim()) {
      if (seen.has(dupKey)) {
        addIssue(originalIdx, {
          column: "SociedadCodigo",
          message: "Posible duplicado (mismos campos clave)",
          severity: "warning",
        })
        duplicates++
      } else {
        seen.add(dupKey)
      }
    }
  })

  // 2) Segunda pasada: reglas de cruce y anomalías por empresa/mes
  // Precalcular IQR por empresa
  const companyBounds = new Map<string, { low: number; high: number }>()
  companyMap.forEach((arr, comp) => {
    if (arr.length >= 4) {
      const sorted = [...arr].sort((a, b) => a - b)
      const { q1, q3 } = quantiles(sorted)
      const iqr = q3 - q1
      companyBounds.set(comp, { low: q1 - 1.5 * iqr, high: q3 + 1.5 * iqr })
    }
  })

  // Precalcular stats mensuales (media, stdev) por empresa/mes
  const monthStats = new Map<string, { m: number; sd: number }>()
  monthCompanyMap.forEach((arr, key) => {
    if (arr.length >= 3) {
      monthStats.set(key, { m: mean(arr), sd: stdev(arr) })
    }
  })

  rows.forEach((row, pos) => {
    const originalIdx = originalIndexMap[pos]
    const amt = numeric(row.MontoEstandarizado)
    const comp = String(row.SociedadNombre ?? row.SociedadCodigo ?? "N/A")

    // Cruce con LibroMayor
    const libro = String(row.LibroMayor ?? "").toLowerCase()
    if (amt !== null) {
      const isNonNegative = NON_NEGATIVE_EXPECTED.some((kw) => libro.includes(kw))
      const isPositiveExpected = POSITIVE_EXPECTED.some((kw) => libro.includes(kw))

      if (isNonNegative && amt < 0) {
        addIssue(originalIdx, {
          column: "MontoEstandarizado",
          message: "Monto negativo inesperado para tipo 'Ingresos/Ventas'",
          severity: "error",
        })
        crossField++
      }
      if (isPositiveExpected && amt > 0) {
        addIssue(originalIdx, {
          column: "MontoEstandarizado",
          message: "Monto positivo inesperado para tipo 'Gastos/Compras'",
          severity: "warning",
        })
        crossField++
      }
    }

    // Anomalía vs IQR empresa
    if (amt !== null && companyBounds.has(comp)) {
      const { low, high } = companyBounds.get(comp)!
      if (amt < low || amt > high) {
        addIssue(originalIdx, {
          column: "MontoEstandarizado",
          message: "Anomalía respecto a distribución histórica de la empresa (IQR)",
          severity: "warning",
        })
        companyIqrAnomalies++
      }
    }

    // Anomalía mensual por empresa (z-score > 3)
    if (amt !== null && dateKey) {
      const mk = monthKey(row[dateKey])
      if (mk) {
        const key = `${comp}__${mk}`
        const st = monthStats.get(key)
        if (st && st.sd > 0) {
          const z = Math.abs((amt - st.m) / st.sd)
          if (z > 3) {
            addIssue(originalIdx, {
              column: "MontoEstandarizado",
              message: "Anomalía mensual por empresa (z-score > 3)",
              severity: "warning",
            })
            monthlyAnomalies++
          }
        }
      }
    }
  })

  // 3) Column hotspots
  const totalRows = rows.length || 1
  const columnStats: Record<string, ColumnStat> = {}
  Object.keys(colIssueCounter).forEach((c) => {
    const issues = colIssueCounter[c]
    columnStats[c] = { issues, ratio: issues / totalRows }
  })
  const hotColumns = Object.keys(columnStats).filter((c) => columnStats[c].ratio >= HOT_COLUMN_RATIO)

  const rowsWithIssues = Object.keys(byIndex).length

  return {
    byIndex,
    rowsWithIssues,
    errors,
    warnings,
    missingRequired,
    duplicates,
    outliers,
    invalidNumbers,
    crossField,
    monthlyAnomalies,
    companyIqrAnomalies,
    columnStats,
    hotColumns,
  }
}

/* =================== Componente =================== */
export function DataTable() {
  const { data, selectedCompanies } = useDataStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(50)
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set())
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [onlyIssues, setOnlyIssues] = useState(false)
  const { toast } = useToast()

  const {
    data: processedData,
    isLoading,
    error,
  } = useQuery<TableQueryResult>({
    queryKey: ["tableData", data, selectedCompanies, searchTerm, sortColumn, sortDirection, onlyIssues],
    queryFn: async (): Promise<TableQueryResult> => {
      await new Promise((resolve) => setTimeout(resolve, 100))

      // preservar índice original
      let filtered = data.map((row, idx) => ({ row, originalIdx: idx }))

      // compañías seleccionadas
      if (selectedCompanies.length > 0) {
        filtered = filtered.filter(({ row }) => {
          const companyDisplay = `${row.SociedadNombre} - ${row.SociedadCodigo}`
          return (
            selectedCompanies.includes(companyDisplay) ||
            selectedCompanies.includes(row.SociedadCodigo) ||
            selectedCompanies.includes(row.SociedadNombre)
          )
        })
      }

      // búsqueda
      if (searchTerm) {
        const q = searchTerm.toLowerCase()
        filtered = filtered.filter(({ row }) =>
          Object.values(row).some((value) => value?.toString().toLowerCase().includes(q)),
        )
      }

      // orden
      if (sortColumn && sortDirection) {
        filtered = [...filtered].sort((a, b) => {
          const aVal = a.row[sortColumn as keyof ProcessedDataRow]
          const bVal = b.row[sortColumn as keyof ProcessedDataRow]
          if (typeof aVal === "number" && typeof bVal === "number") {
            return sortDirection === "asc" ? aVal - bVal : bVal - aVal
          }
          const aStr = aVal?.toString() || ""
          const bStr = bVal?.toString() || ""
          return sortDirection === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr)
        })
      }

      // verificación (sobre dataset filtrado/ordenado)
      const rows = filtered.map((f) => f.row)
      const indexMap = filtered.map((f) => f.originalIdx)
      const verification = verifyData(rows, indexMap)

      // solo filas con issues
      let finalRows = rows
      let finalIndexMap = indexMap
      if (onlyIssues) {
        finalRows = []
        finalIndexMap = []
        rows.forEach((r, pos) => {
          const orig = indexMap[pos]
          if (verification.byIndex[orig]?.length) {
            finalRows.push(r)
            finalIndexMap.push(orig)
          }
        })
      }

      return {
        data: finalRows,
        totalCount: finalRows.length,
        indexMap: finalIndexMap,
        verification,
      }
    },
    enabled: data.length > 0,
    staleTime: 5 * 60 * 1000,
  })

  const filteredData = processedData?.data || []
  const totalCount = processedData?.totalCount || 0
  const indexMap = processedData?.indexMap || []
  const verification = processedData?.verification

  const columns = useMemo(() => {
    if (data.length === 0) return []
    return Object.keys(data[0]).filter((key) => !hiddenColumns.has(key) && !key.startsWith("_"))
  }, [data, hiddenColumns])

  const allColumns = useMemo(() => {
    if (data.length === 0) return []
    return Object.keys(data[0]).filter((key) => !key.startsWith("_"))
  }, [data])

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredData.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredData, currentPage, itemsPerPage])

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  const toggleColumn = (column: string) => {
    const next = new Set(hiddenColumns)
    if (next.has(column)) next.delete(column)
    else next.add(column)
    setHiddenColumns(next)
  }

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      if (sortDirection === "asc") setSortDirection("desc")
      else if (sortDirection === "desc") {
        setSortColumn(null)
        setSortDirection(null)
      } else setSortDirection("asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return <ArrowUpDown className="h-4 w-4 opacity-50" />
    if (sortDirection === "asc") return <ArrowUp className="h-4 w-4 text-primary" />
    return <ArrowDown className="h-4 w-4 text-primary" />
  }

  const exportTableData = () => {
    const headers = columns.join(",")
    const csvContent = [
      headers,
      ...filteredData.map((row) =>
        columns
          .map((col) => {
            const value = row[col as keyof ProcessedDataRow]
            return typeof value === "string" && value.includes(",") ? `"${value}"` : value
          })
          .join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `datos_filtrados_${new Date().toISOString().split("T")[0]}.csv`
    link.click()

    toast({ title: "Datos exportados", description: `Se han exportado ${filteredData.length} registros correctamente` })
  }

  const exportIssues = () => {
    if (!verification) return
    const rows: string[] = ["originalIndex,column,severity,message"]
    Object.entries(verification.byIndex).forEach(([origIdx, issues]) => {
      issues.forEach((iss) => {
        rows.push(`${origIdx},${iss.column},${iss.severity},"${iss.message.replace(/"/g, '""')}"`)
      })
    })
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `issues_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    toast({ title: "Verificación exportada", description: "Se exportaron los issues a CSV" })
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
        <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">Procesando datos...</h3>
        <p className="text-gray-500 dark:text-gray-500">Por favor espera mientras procesamos la información</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mb-4">
          <span className="text-red-600 dark:text-red-400 text-2xl">⚠️</span>
        </div>
        <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">Error al procesar datos</h3>
        <p className="text-gray-500 dark:text-gray-500">Hubo un problema al procesar los datos</p>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mb-4">
          <Table className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">No hay datos para mostrar</h3>
        <p className="text-gray-500 dark:text-gray-500">Carga archivos CSV para comenzar a visualizar los datos</p>
      </div>
    )
  }

  const getIssuesForRenderedRow = (renderIndex: number) => {
    const absoluteIndex = (currentPage - 1) * itemsPerPage + renderIndex
    const originalIndex = indexMap[absoluteIndex]
    return verification?.byIndex[originalIndex] || []
  }

  const rowHasIssues = (renderIndex: number) => getIssuesForRenderedRow(renderIndex).length > 0

  const cellHasIssue = (renderIndex: number, column: string) =>
    getIssuesForRenderedRow(renderIndex).some((i) => i.column === column)

  const isHotColumn = (column: string) => (verification?.hotColumns || []).includes(column)
  const hotColumnTip = (column: string) => {
    const s = verification?.columnStats?.[column]
    if (!s) return undefined
    return `Columna con alto % de incidencias (${(s.ratio * 100).toFixed(1)}%)`
  }

  return (
    <div className="space-y-6" id="table-section">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Tabla de Datos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Visualiza y filtra tus datos de manera interactiva</p>
        </div>
        {selectedCompanies.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedCompanies.slice(0, 2).map((company) => (
              <Badge key={company} variant="outline" className="bg-white/50 dark:bg-slate-800/50 text-xs">
                {company.length > 20 ? `${company.slice(0, 20)}...` : company}
              </Badge>
            ))}
            {selectedCompanies.length > 2 && (
              <Badge variant="outline" className="bg-white/50 dark:bg-slate-800/50 text-xs">
                +{selectedCompanies.length - 2} más
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Verification Summary */}
      {verification && (
        <Card className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-sm border-gray-200/50 dark:border-slate-700/50">
          <CardContent className="p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              {verification.rowsWithIssues > 0 ? (
                <ShieldAlert className="h-5 w-5 text-amber-600" />
              ) : (
                <ShieldCheck className="h-5 w-5 text-green-600" />
              )}
              <div className="text-sm">
                <div className="font-medium">
                  Verificación:{" "}
                  {verification.rowsWithIssues > 0
                    ? `${verification.rowsWithIssues} fila(s) con observaciones`
                    : "sin observaciones"}
                </div>
                <div className="text-muted-foreground mt-0.5">
                  {verification.errors} errores • {verification.warnings} advertencias • req. faltantes:{" "}
                  {verification.missingRequired} • duplicados: {verification.duplicates} • outliers abs:{" "}
                  {verification.outliers} • cruce campos: {verification.crossField} • IQR empresa:{" "}
                  {verification.companyIqrAnomalies} • z-score mensual: {verification.monthlyAnomalies}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant={onlyIssues ? "default" : "outline"}
                onClick={() => {
                  setCurrentPage(1)
                  setOnlyIssues((v) => !v)
                }}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                {onlyIssues ? "Ver todas las filas" : "Mostrar solo con problemas"}
              </Button>

              <Button variant="outline" onClick={exportIssues}>
                <Download className="h-4 w-4 mr-2" />
                Exportar issues
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controls */}
      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-gray-200/50 dark:border-slate-700/50">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar en los datos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/50 dark:bg-slate-800/50 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                <SelectTrigger className="w-32 bg-white/50 dark:bg-slate-800/50 text-gray-900 dark:text-gray-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 filas</SelectItem>
                  <SelectItem value="50">50 filas</SelectItem>
                  <SelectItem value="100">100 filas</SelectItem>
                  <SelectItem value="200">200 filas</SelectItem>
                </SelectContent>
              </Select>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-white/50 dark:bg-slate-800/50 text-gray-900 dark:text-gray-100"
                  >
                    <Columns className="h-4 w-4 mr-2" />
                    Columnas ({columns.length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 max-h-96 overflow-y-auto">
                  {allColumns.map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column}
                      checked={!hiddenColumns.has(column)}
                      onCheckedChange={() => toggleColumn(column)}
                    >
                      {column}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" onClick={exportTableData} className="bg-white/50 dark:bg-slate-800/50">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-gray-200/50 dark:border-slate-700/50 shadow-xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border-b-2 border-slate-200 dark:border-slate-600">
                  {columns.map((column) => {
                    const hot = isHotColumn(column)
                    return (
                      <TableHead
                        key={column}
                        className={
                          "whitespace-nowrap font-semibold py-4 cursor-pointer transition-colors " +
                          (hot
                            ? " bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border-b-amber-300 dark:border-b-amber-700"
                            : " text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700")
                        }
                        onClick={() => handleSort(column)}
                        title={hot ? hotColumnTip(column) : "Ordenar"}
                      >
                        <div className="flex items-center gap-2">
                          {column}
                          {hot && <AlertTriangle className="h-4 w-4" />}
                          {getSortIcon(column)}
                        </div>
                      </TableHead>
                    )
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((row, renderIndex) => {
                  const hasIssues = rowHasIssues(renderIndex)
                  const issues = getIssuesForRenderedRow(renderIndex)

                  return (
                    <TableRow
                      key={renderIndex}
                      className={
                        hasIssues
                          ? "bg-amber-50/60 dark:bg-amber-900/20 transition-colors border-b border-slate-100 dark:border-slate-800"
                          : "hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800"
                      }
                      title={hasIssues ? issues.map((i) => `${i.column}: ${i.message}`).join(" • ") : undefined}
                    >
                      {columns.map((column) => {
                        const bad = cellHasIssue(renderIndex, column)
                        return (
                          <TableCell
                            key={column}
                            className={
                              "whitespace-nowrap py-3 text-slate-600 dark:text-slate-400 " +
                              (bad
                                ? " underline decoration-red-400 decoration-2 underline-offset-4"
                                : "")
                            }
                            title={
                              bad
                                ? issues
                                    .filter((i) => i.column === column)
                                    .map((i) => i.message)
                                    .join(" • ")
                                : undefined
                            }
                          >
                            {row[column as keyof ProcessedDataRow]?.toString() || "-"}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-gray-200/50 dark:border-slate-700/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)} a{" "}
              {Math.min(currentPage * itemsPerPage, totalCount)} de {totalCount.toLocaleString()} registros
              {selectedCompanies.length > 0 && (
                <span className="ml-2">(filtrado de {data.length.toLocaleString()} total)</span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="bg-white/50 dark:bg-slate-800/50 text-gray-900 dark:text-gray-100"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>

              <span className="text-sm px-3 py-1 bg-white/50 dark:bg-slate-800/50 rounded border text-gray-900 dark:text-gray-100">
                Página {currentPage} de {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="bg-white/50 dark:bg-slate-800/50 text-gray-900 dark:text-gray-100"
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
