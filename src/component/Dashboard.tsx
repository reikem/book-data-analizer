import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { useDataStore } from "@/lib/store"
import { useToast } from "@/hook/useToast"

import {
  LineChart as ReLineChart,
  Line,
  BarChart as ReBarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

import {
  TrendingUp,
  TrendingDown,
  Grip,
  Plus,
  Download,
  Edit,
  Trash,
} from "lucide-react"

import html2canvas from "html2canvas"
import jsPDF from "jspdf"

import { HeatMapChart } from "@/component/charts/HeatmapChart"
import { exportChartAsImage } from "@/lib/ chartExport"


// ------------------------------------------------------
// helpers
// ------------------------------------------------------
const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"]

const money = (v: number) => {
  const n = Number(v) || 0
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
  return `$${n.toLocaleString()}`
}

const getAmount = (row: Record<string, any>) => {
  const keys = ["MontoEstandarizado", "monto", "Importe en ML", "Importe ML", "Importe", "amount"]
  for (const k of keys) {
    const v = row[k]
    const n = typeof v === "string" ? Number(v.replace(/\./g, "").replace(",", ".")) : Number(v)
    if (!Number.isNaN(n)) return n
  }
  return 0
}

const getVal = (row: Record<string, any>, keys: string[], fallback = "-") => {
  for (const k of keys) {
    const v = row[k]
    if (v !== undefined && v !== null && String(v).trim() !== "") return v
  }
  return fallback
}

// ------------------------------------------------------
// types locales
// ------------------------------------------------------
type WidgetSize = "small" | "medium" | "large"
type WidgetType = "kpi" | "chart" | "table"

interface DashboardWidget {
  id: string
  type: WidgetType
  title: string
  component: React.ReactNode
  size: WidgetSize
  editable?: boolean
}

// ------------------------------------------------------
// exportador (1 página, respeta tema)
// ------------------------------------------------------
async function exportFullDashboardOnePage(containerId: string, fileBase: string) {
  const el = document.getElementById(containerId)
  if (!el) throw new Error("No se encontró el contenedor a exportar")

  // Color de fondo según tema actual
  const bg = getComputedStyle(document.body).backgroundColor

  const canvas = await html2canvas(el, {
    scale: 2,
    backgroundColor: bg, // respeta modo claro/oscuro/drácula
    useCORS: true,
    allowTaint: true,
    windowWidth: el.scrollWidth,
    windowHeight: el.scrollHeight,
    scrollX: 0,
    scrollY: -window.scrollY,
  })

  const img = canvas.toDataURL("image/png")
  const orientation = canvas.width > canvas.height ? "l" : "p"
  const pdf = new jsPDF({
    orientation,
    unit: "px",
    format: [canvas.width, canvas.height], // página del tamaño exacto -> nada se corta
    compress: true,
  })

  pdf.addImage(img, "PNG", 0, 0, canvas.width, canvas.height)

  const theme = document.documentElement.getAttribute("data-theme") || (document.documentElement.classList.contains("dark") ? "dark" : "light")
  const date = new Date().toISOString().slice(0, 10)
  pdf.save(`${fileBase}_${theme}_${date}.pdf`)
}

// ------------------------------------------------------
// componente principal
// ------------------------------------------------------
export function Dashboard() {
  const {
    data,
    selectedCompanies,
    dashboardTitle,
    dashboardDescription,
    updateDashboardInfo,
  } = useDataStore()
  const { toast } = useToast()

  const [widgets, setWidgets] = useState<DashboardWidget[]>([])
  const [selectedWidgetId, setSelectedWidgetId] = useState("")
  const [editingWidget, setEditingWidget] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editingHeader, setEditingHeader] = useState(false)
  const [newTitle, setNewTitle] = useState(dashboardTitle || "Dashboard Analítico")
  const [newDesc, setNewDesc] = useState(dashboardDescription || "Métricas clave y visualizaciones de tus datos")

  // --- filtrar por sociedades del Sidebar ---
  const filteredData = useMemo(() => {
    if (!data.length || !selectedCompanies.length) return data
    return data.filter((row) => {
      const nombre = (row.SociedadNombre || row.Sociedad || row["Soc."] || "").toString()
      const codigo = (row.SociedadCodigo || row.codigo || "").toString()
      const combo = nombre && codigo ? `${nombre} - ${codigo}` : ""
      return (
        (combo && selectedCompanies.includes(combo)) ||
        (codigo && selectedCompanies.includes(codigo)) ||
        (nombre && selectedCompanies.includes(nombre))
      )
    })
  }, [data, selectedCompanies])

  // --- métricas ---
  const stats = useMemo(() => {
    if (!filteredData.length) return null
    const totalRecords = filteredData.length
    const uniqueCompanies = new Set(
      filteredData.map((r) => r.SociedadCodigo || r.Sociedad || r["Soc."] || r.codigo).filter(Boolean),
    ).size
    const amounts = filteredData.map(getAmount)
    const totalAmount = amounts.reduce((a, b) => a + b, 0)
    const avgAmount = amounts.length ? totalAmount / amounts.length : 0

    const monthly = filteredData.reduce((acc, row) => {
      const month = (row.Mes || row.mes || "Sin mes").toString()
      const amt = getAmount(row)
      if (!acc[month]) acc[month] = { month, total: 0, count: 0 }
      acc[month].total += amt
      acc[month].count += 1
      return acc
    }, {} as Record<string, { month: string; total: number; count: number }>)
    const chartData = Object.values(monthly).slice(0, 12)

    const byCompany = filteredData.reduce((acc, row) => {
      const company = (row.SociedadNombre || row.SociedadCodigo || "Sin clasificar").toString()
      if (!acc[company]) acc[company] = { name: company, value: 0 }
      acc[company].value += Math.abs(getAmount(row))
      return acc
    }, {} as Record<string, { name: string; value: number }>)
    const pieData = Object.values(byCompany)
      .map((d) => ({ ...d, name: d.name.length > 16 ? d.name.slice(0, 16) + "…" : d.name }))
      .slice(0, 6)

    return { totalRecords, uniqueCompanies, totalAmount, avgAmount, chartData, pieData }
  }, [filteredData])

  // --- widgets por defecto ---
  const defaultWidgets: DashboardWidget[] = useMemo(() => {
    if (!stats) return []
    return [
      {
        id: "kpi-total",
        type: "kpi",
        title: "Total Registros",
        size: "small",
        editable: true,
        component: (
          <Card className="h-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm text-blue-800 dark:text-blue-200">
                {editingWidget === "kpi-total" ? (
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="h-7 text-sm"
                    onBlur={() => setEditingWidget(null)}
                    onKeyDown={(e) => e.key === "Enter" && setEditingWidget(null)}
                  />
                ) : (
                  "Total Registros"
                )}
              </CardTitle>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => setEditingWidget("kpi-total")}>
                  <Edit className="h-3 w-3" />
                </Button>
                <RemoveButton id="kpi-total" title="Total Registros" onRemove={removeWidget} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {stats.totalRecords.toLocaleString()}
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400">Datos procesados</p>
            </CardContent>
          </Card>
        ),
      },
      {
        id: "kpi-companies",
        type: "kpi",
        title: "Sociedades",
        size: "small",
        editable: true,
        component: (
          <Card className="h-full bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm text-green-800 dark:text-green-200">Sociedades</CardTitle>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => setEditingWidget("kpi-companies")}>
                  <Edit className="h-3 w-3" />
                </Button>
                <RemoveButton id="kpi-companies" title="Sociedades" onRemove={removeWidget} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.uniqueCompanies}</div>
              <p className="text-xs text-green-600 dark:text-green-400">Empresas únicas</p>
            </CardContent>
          </Card>
        ),
      },
      {
        id: "kpi-total-amount",
        type: "kpi",
        title: "Monto Total",
        size: "small",
        editable: true,
        component: (
          <Card className="h-full bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm text-purple-800 dark:text-purple-200">Monto Total</CardTitle>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => setEditingWidget("kpi-total-amount")}>
                  <Edit className="h-3 w-3" />
                </Button>
                <RemoveButton id="kpi-total-amount" title="Monto Total" onRemove={removeWidget} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-purple-700 dark:text-purple-300">{money(stats.totalAmount)}</div>
              <div className="text-xs flex items-center">
                {stats.totalAmount >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                )}
                <span className={stats.totalAmount >= 0 ? "text-green-600" : "text-red-600"}>
                  {stats.totalAmount >= 0 ? "Positivo" : "Negativo"}
                </span>
              </div>
            </CardContent>
          </Card>
        ),
      },
      {
        id: "kpi-avg",
        type: "kpi",
        title: "Promedio",
        size: "small",
        editable: true,
        component: (
          <Card className="h-full bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm text-orange-800 dark:text-orange-200">Promedio</CardTitle>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => setEditingWidget("kpi-avg")}>
                  <Edit className="h-3 w-3" />
                </Button>
                <RemoveButton id="kpi-avg" title="Promedio" onRemove={removeWidget} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-orange-700 dark:text-orange-300">{money(stats.avgAmount)}</div>
              <p className="text-xs text-orange-600 dark:text-orange-400">Por registro</p>
            </CardContent>
          </Card>
        ),
      },

      // charts
      {
        id: "chart-trend",
        type: "chart",
        title: "Tendencia Mensual",
        size: "large",
        editable: true,
        component: (
          <Card className="h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50">
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle>Tendencia Mensual</CardTitle>
                <CardDescription>Evolución de montos por mes</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => exportChartAsImage("chart-trend", "Tendencia Mensual")}>
                  <Download className="h-4 w-4" />
                </Button>
                <RemoveButton id="chart-trend" title="Tendencia Mensual" onRemove={removeWidget} />
              </div>
            </CardHeader>
            <CardContent id="chart-trend">
              <ResponsiveContainer width="100%" height={300}>
                <ReLineChart data={stats.chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v) => money(Number(v))} />
                  <Tooltip formatter={(v) => [money(Number(v)), "Monto"]} />
                  <Line type="monotone" dataKey="total" stroke={CHART_COLORS[0]} strokeWidth={3} dot />
                </ReLineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ),
      },
      {
        id: "chart-volume",
        type: "chart",
        title: "Volumen por Mes",
        size: "medium",
        editable: true,
        component: (
          <Card className="h-full bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20">
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle>Volumen por Mes</CardTitle>
                <CardDescription>Cantidad de registros</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => exportChartAsImage("chart-volume", "Volumen por Mes")}>
                  <Download className="h-4 w-4" />
                </Button>
                <RemoveButton id="chart-volume" title="Volumen por Mes" onRemove={removeWidget} />
              </div>
            </CardHeader>
            <CardContent id="chart-volume">
              <ResponsiveContainer width="100%" height={260}>
                <ReBarChart data={stats.chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
                </ReBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ),
      },
      {
        id: "chart-distribution",
        type: "chart",
        title: "Distribución por Sociedad",
        size: "medium",
        editable: true,
        component: (
          <Card className="h-full bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20">
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle>Distribución por Sociedad</CardTitle>
                <CardDescription>Montos por empresa</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => exportChartAsImage("chart-distribution", "Distribución por Sociedad")}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <RemoveButton id="chart-distribution" title="Distribución por Sociedad" onRemove={removeWidget} />
              </div>
            </CardHeader>
            <CardContent id="chart-distribution">
              <ResponsiveContainer width="100%" height={260}>
                <RePieChart>
                  <Pie data={stats.pieData} cx="50%" cy="50%" outerRadius={85} dataKey="value"
                       label={({ name, percent }) => `${name} ${(((percent ?? 0) * 100)).toFixed(0)}%`}>
                    {stats.pieData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [money(Number(v)), "Monto"]} />
                </RePieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ),
      },
      {
        id: "chart-heatmap",
        type: "chart",
        title: "Mapa de Calor de Datos",
        size: "large",
        editable: true,
        component: (
          <Card className="h-full bg-gradient-to-br from-rose-50 to-pink-100 dark:from-rose-900/20 dark:to-pink-800/20">
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle>Mapa de Calor de Datos</CardTitle>
                <CardDescription>Intensidad de valores por registro</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => exportChartAsImage("chart-heatmap", "Mapa de Calor")}>
                  <Download className="h-4 w-4" />
                </Button>
                <RemoveButton id="chart-heatmap" title="Mapa de Calor de Datos" onRemove={removeWidget} />
              </div>
            </CardHeader>
            <CardContent id="chart-heatmap">
              <HeatMapChart data={filteredData} />
            </CardContent>
          </Card>
        ),
      },

      // tabla estilo captura (muestra NOMBRE de sociedad)
      {
        id: "table-last10",
        type: "table",
        title: "Tabla de Datos",
        size: "large",
        editable: true,
        component: (
          <Card className="h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900/60 dark:to-slate-900/30">
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle>Tabla de Datos</CardTitle>
                <CardDescription>Últimos 10 registros</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => exportChartAsImage("table-last10", "Tabla de Datos")}>
                  <Download className="h-4 w-4" />
                </Button>
                <RemoveButton id="table-last10" title="Tabla de Datos" onRemove={removeWidget} />
              </div>
            </CardHeader>
            <CardContent id="table-last10">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sociedad</TableHead>
                      <TableHead>Libro Mayor</TableHead>
                      <TableHead>monto</TableHead>
                      <TableHead>Fecha Dcto</TableHead>
                      <TableHead>status</TableHead>
                      <TableHead>Mes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.slice(0, 10).map((row, i) => {
                      const sociedadNombre = getVal(row, ["SociedadNombre", "Sociedad", "Soc."], "-")
                      const libro = getVal(row, ["LibroMayor", "Libro mayor", "Libro Mayor"], "-")
                      const monto = getAmount(row)
                      const fecha = getVal(row, ["Fecha Dcto", "FechaDcto", "Fecha", "fecha"], "-")
                      const status = getVal(row, ["status", "Estado", "Estado Dcto"], "-")
                      const mes = getVal(row, ["Mes", "mes"], "-")
                      return (
                        <TableRow key={i}>
                          <TableCell className="whitespace-nowrap">{String(sociedadNombre)}</TableCell>
                          <TableCell className="whitespace-nowrap">{String(libro)}</TableCell>
                          <TableCell className="whitespace-nowrap">{money(monto)}</TableCell>
                          <TableCell className="whitespace-nowrap">{String(fecha)}</TableCell>
                          <TableCell className="whitespace-nowrap">{String(status)}</TableCell>
                          <TableCell className="whitespace-nowrap">{String(mes)}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ),
      },
    ]
  }, [stats, filteredData, editingWidget, editTitle])

  // Inicializa widgets con los "por defecto" una sola vez,
  // así cuando agregues nuevos no desaparece lo ya visible.
  useEffect(() => {
    if (stats && widgets.length === 0 && defaultWidgets.length > 0) {
      setWidgets(defaultWidgets)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats, defaultWidgets.length])

  // quitar widget con confirmación
  function removeWidget(id: string, title: string) {
    if (!window.confirm(`¿Deseas quitar "${title}" del dashboard?`)) return
    setWidgets((prev) => prev.filter((w) => w.id !== id))
    toast({ title: "Widget eliminado", description: `"${title}" fue quitado del dashboard` })
  }

  // DnD
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const items = Array.from(widgets)
    const [moved] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, moved)
    setWidgets(items)
  }

  // agregar widget (apendea; no reemplaza)
  const addWidget = () => {
    if (!selectedWidgetId) return
    const found = defaultWidgets.find((w) => w.id === selectedWidgetId)
    if (!found) return
    if (widgets.some((w) => w.id === found.id)) return
    setWidgets((prev) => [...prev, found])
    setSelectedWidgetId("")
    toast({ title: "Widget agregado", description: `${found.title} se añadió al final` })
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <div className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">Dashboard no disponible</div>
        <p className="text-gray-500 dark:text-gray-500">Carga datos para ver el dashboard</p>
      </div>
    )
  }

  const inUseIds = new Set(widgets.map((w) => w.id))
  const availableToAdd = defaultWidgets // mostramos todos, los que estén en uso van deshabilitados

  return (
    <div className="space-y-6" id="dashboard-section">
      {/* header editable (como tu captura) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex-1">
          {editingHeader ? (
            <div className="space-y-3">
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="text-3xl lg:text-5xl font-extrabold h-14"
                placeholder="Título del dashboard"
              />
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full rounded-md border bg-background p-3 text-base"
                rows={3}
                placeholder="Descripción del dashboard"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    updateDashboardInfo(newTitle.trim() || "Dashboard Analítico", newDesc.trim())
                    setEditingHeader(false)
                  }}
                >
                  Guardar
                </Button>
                <Button variant="outline" onClick={() => setEditingHeader(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="cursor-pointer" onClick={() => setEditingHeader(true)}>
              <h1 className="text-3xl lg:text-5xl font-extrabold leading-tight bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                {dashboardTitle || "Dashboard Analítico"}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {dashboardDescription || "Métricas clave y visualizaciones de tus datos"}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Button
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            onClick={() => exportFullDashboardOnePage("dashboard-section", (dashboardTitle || "dashboard").replace(/\s+/g, "_").toLowerCase())}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar Dashboard
          </Button>

          <div className="flex items-center gap-2">
            <Select value={selectedWidgetId} onValueChange={setSelectedWidgetId}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Agregar widget..." />
              </SelectTrigger>
              <SelectContent>
                {availableToAdd.map((w) => {
                  const inUse = inUseIds.has(w.id)
                  return (
                    <SelectItem key={w.id} value={w.id} disabled={inUse}>
                      <div className="flex items-center gap-2">
                        <span>{w.title}</span>
                        {inUse && <span className="text-xs text-muted-foreground">✓ en uso</span>}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            <Button onClick={addWidget} disabled={!selectedWidgetId} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {selectedCompanies.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedCompanies.slice(0, 2).map((c) => (
                <Badge key={c} variant="outline" className="bg-white/50 dark:bg-slate-800/50 text-xs">
                  {c.length > 24 ? `${c.slice(0, 24)}…` : c}
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
      </div>

      {/* grid + drag */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="dashboard">
          {(drop) => (
            <div
              {...drop.droppableProps}
              ref={drop.innerRef}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 auto-rows-max"
            >
              {widgets.map((widget, index) => (
                <Draggable key={widget.id} draggableId={widget.id} index={index}>
                  {(drag, snapshot) => (
                    <div
                      ref={drag.innerRef}
                      {...drag.draggableProps}
                      className={`
                        ${widget.size === "small" ? "col-span-1" : ""}
                        ${widget.size === "medium" ? "col-span-1 sm:col-span-2" : ""}
                        ${widget.size === "large" ? "col-span-1 sm:col-span-2 lg:col-span-4" : ""}
                        ${snapshot.isDragging ? "rotate-1 scale-105 shadow-2xl z-50" : ""}
                        transition-all duration-200
                      `}
                    >
                      <div className="relative group h-full">
                        {/* mango drag */}
                        <div
                          {...drag.dragHandleProps}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10"
                        >
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Grip className="h-3 w-3" />
                          </Button>
                        </div>
                        <div id={widget.id}>{widget.component}</div>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {drop.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  )
}

// Botón reutilizable para remover con confirmación
function RemoveButton({
  id,
  title,
  onRemove,
}: {
  id: string
  title: string
  onRemove: (id: string, title: string) => void
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => onRemove(id, title)}
      title="Quitar del dashboard"
      className="text-red-500 hover:text-red-700"
    >
      <Trash className="h-4 w-4" />
    </Button>
  )
}
