import type React from "react"
import { useState, useMemo } from "react"



import {
  BarChart as ReBarChart,
  Bar,
  LineChart as ReLineChart,
  Line,
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
  DollarSign,
  Users,
  FileText,
  Calendar,
  Grip,
  Plus,
  Download,
  Edit,
  Table as TableIcon,
  Badge,
} from "lucide-react"


import { useToast } from "@/hook/useToast"
import { exportChartAsImage } from "@/lib/ chartExport"
import { HeatMapChart } from "./charts/HeatmapChart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useDataStore } from "@/lib/store"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@radix-ui/react-select"

type WidgetSize = "small" | "medium" | "large"
type WidgetType = "kpi" | "chart" | "table" | "list"

interface DashboardWidget {
  id: string
  type: WidgetType
  title: string
  component: React.ReactNode
  size: WidgetSize
  editable?: boolean
}

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"]

const formatCurrency = (value: number) => {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toFixed(0)}`
}

export function Dashboard() {
  const { data, selectedCompanies } = useDataStore()
  const [widgets, setWidgets] = useState<DashboardWidget[]>([])
  const [selectedWidgetId, setSelectedWidgetId] = useState<string>("")
  const [editingWidget, setEditingWidget] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const { toast } = useToast()

  const filteredData = useMemo(() => {
    if (selectedCompanies.length === 0) return data
    return data.filter((row) => {
      const companyDisplay = `${row.SociedadNombre} - ${row.SociedadCodigo}`
      return (
        selectedCompanies.includes(companyDisplay) ||
        selectedCompanies.includes(row.SociedadCodigo) ||
        selectedCompanies.includes(row.SociedadNombre)
      )
    })
  }, [data, selectedCompanies])

  const dashboardStats = useMemo(() => {
    if (filteredData.length === 0) return null

    const totalRecords = filteredData.length
    const uniqueCompanies = new Set(
      filteredData.map((row) => row.SociedadCodigo || row.Sociedad || row["Soc."] || row.codigo).filter(Boolean),
    ).size

    const amounts = filteredData.map((row) => row.MontoEstandarizado || 0).filter((val) => !isNaN(val) && val !== 0)
    const totalAmount = amounts.reduce((sum, val) => sum + val, 0)
    const avgAmount = amounts.length > 0 ? totalAmount / amounts.length : 0

    // Datos mensuales
    const monthlyData = filteredData.reduce(
      (acc, row) => {
        const month = row.Mes || row.mes || "Sin mes"
        const amount = row.MontoEstandarizado || 0
        if (!acc[month]) acc[month] = { month, total: 0, count: 0 }
        acc[month].total += amount
        acc[month].count += 1
        return acc
      },
      {} as Record<string, { month: string; total: number; count: number }>,
    )
    const chartData = Object.values(monthlyData).slice(0, 12)

    // Distribución por sociedad (para pie)
    const companyData = filteredData.reduce(
      (acc, row) => {
        const company = row.SociedadNombre || row.SociedadCodigo || "Sin clasificar"
        if (!acc[company]) {
          acc[company] = { name: company.length > 15 ? company.substring(0, 15) + "..." : company, value: 0, count: 0 }
        }
        acc[company].value += Math.abs(row.MontoEstandarizado || 0)
        acc[company].count += 1
        return acc
      },
      {} as Record<string, { name: string; value: number; count: number }>,
    )
    const pieData = Object.values(companyData).slice(0, 6)

    return {
      totalRecords,
      uniqueCompanies,
      totalAmount,
      avgAmount,
      chartData,
      pieData,
      positiveAmount: amounts.filter((a) => a > 0).length,
      negativeAmount: amounts.filter((a) => a < 0).length,
    }
  }, [filteredData])

  const startEditingWidget = (widgetId: string, currentTitle: string) => {
    setEditingWidget(widgetId)
    setEditTitle(currentTitle)
  }

  const saveWidgetTitle = (widgetId: string) => {
    setEditingWidget(null)
    toast({
      title: "Título actualizado",
      description: `El título del widget se ha actualizado a "${editTitle}"`,
    })
  }

  // Widgets por defecto (incluye “Datos Recientes” y “Tabla de Datos”)
  const defaultWidgets: DashboardWidget[] = useMemo(() => {
    if (!dashboardStats) return []

    return [
      // KPIs
      {
        id: "total-records",
        type: "kpi",
        title: "Total Registros",
        size: "small",
        editable: true,
        component: (
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800 h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">
                {editingWidget === "total-records" ? (
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="h-6 text-sm"
                    onBlur={() => saveWidgetTitle("total-records")}
                    onKeyDown={(e) => e.key === "Enter" && saveWidgetTitle("total-records")}
                  />
                ) : (
                  "Total Registros"
                )}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 no-print"
                  onClick={() => startEditingWidget("total-records", "Total Registros")}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {dashboardStats.totalRecords.toLocaleString()}
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400">Datos procesados</p>
            </CardContent>
          </Card>
        ),
      },
      {
        id: "companies",
        type: "kpi",
        title: "Sociedades",
        size: "small",
        editable: true,
        component: (
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800 h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200">
                {editingWidget === "companies" ? (
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="h-6 text-sm"
                    onBlur={() => saveWidgetTitle("companies")}
                    onKeyDown={(e) => e.key === "Enter" && saveWidgetTitle("companies")}
                  />
                ) : (
                  "Sociedades"
                )}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 no-print"
                  onClick={() => startEditingWidget("companies", "Sociedades")}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Users className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {dashboardStats.uniqueCompanies}
              </div>
              <p className="text-xs text-green-600 dark:text-green-400">Empresas únicas</p>
            </CardContent>
          </Card>
        ),
      },
      {
        id: "total-amount",
        type: "kpi",
        title: "Monto Total",
        size: "small",
        editable: true,
        component: (
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800 h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800 dark:text-purple-200">
                {editingWidget === "total-amount" ? (
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="h-6 text-sm"
                    onBlur={() => saveWidgetTitle("total-amount")}
                    onKeyDown={(e) => e.key === "Enter" && saveWidgetTitle("total-amount")}
                  />
                ) : (
                  "Monto Total"
                )}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 no-print"
                  onClick={() => startEditingWidget("total-amount", "Monto Total")}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <DollarSign className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-purple-700 dark:text-purple-300">
                {formatCurrency(Math.abs(dashboardStats.totalAmount))}
              </div>
              <div className="flex items-center text-xs">
                {dashboardStats.totalAmount >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                )}
                <span className={dashboardStats.totalAmount >= 0 ? "text-green-600" : "text-red-600"}>
                  {dashboardStats.totalAmount >= 0 ? "Positivo" : "Negativo"}
                </span>
              </div>
            </CardContent>
          </Card>
        ),
      },
      {
        id: "avg-amount",
        type: "kpi",
        title: "Promedio",
        size: "small",
        editable: true,
        component: (
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800 h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-800 dark:text-orange-200">
                {editingWidget === "avg-amount" ? (
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="h-6 text-sm"
                    onBlur={() => saveWidgetTitle("avg-amount")}
                    onKeyDown={(e) => e.key === "Enter" && saveWidgetTitle("avg-amount")}
                  />
                ) : (
                  "Promedio"
                )}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 no-print"
                  onClick={() => startEditingWidget("avg-amount", "Promedio")}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Calendar className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-orange-700 dark:text-orange-300">
                {formatCurrency(Math.abs(dashboardStats.avgAmount))}
              </div>
              <p className="text-xs text-orange-600 dark:text-orange-400">Por registro</p>
            </CardContent>
          </Card>
        ),
      },

      // Gráficos
      {
        id: "monthly-trend",
        type: "chart",
        title: "Tendencia Mensual",
        size: "large",
        editable: true,
        component: (
          <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-slate-800 dark:text-slate-200">
                  {editingWidget === "monthly-trend" ? (
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="h-8"
                      onBlur={() => saveWidgetTitle("monthly-trend")}
                      onKeyDown={(e) => e.key === "Enter" && saveWidgetTitle("monthly-trend")}
                    />
                  ) : (
                    "Tendencia Mensual"
                  )}
                </CardTitle>
                <CardDescription>Evolución de montos por mes</CardDescription>
              </div>
              <div className="flex items-center gap-2 no-print">
                <Button variant="ghost" size="sm" onClick={() => startEditingWidget("monthly-trend", "Tendencia Mensual")}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent"
                  onClick={() => {
                    exportChartAsImage("monthly-trend", "Tendencia Mensual")
                    toast({ title: "Gráfico exportado", description: "La imagen se ha descargado correctamente" })
                  }}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ReLineChart data={dashboardStats.chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 12 }} />
                  <YAxis className="text-xs" tick={{ fontSize: 12 }} tickFormatter={(v) => formatCurrency(Number(v))} />
                  <Tooltip
                    formatter={(value) => [formatCurrency(Number(value)), "Monto"]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke={CHART_COLORS[0]}
                    strokeWidth={3}
                    dot={{ fill: CHART_COLORS[0], strokeWidth: 2, r: 6 }}
                  />
                </ReLineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ),
      },
      {
        id: "monthly-volume",
        type: "chart",
        title: "Volumen Mensual",
        size: "medium",
        editable: true,
        component: (
          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-indigo-800 dark:text-indigo-200">
                  {editingWidget === "monthly-volume" ? (
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="h-8"
                      onBlur={() => saveWidgetTitle("monthly-volume")}
                      onKeyDown={(e) => e.key === "Enter" && saveWidgetTitle("monthly-volume")}
                    />
                  ) : (
                    "Volumen por Mes"
                  )}
                </CardTitle>
                <CardDescription>Cantidad de registros</CardDescription>
              </div>
              <div className="flex items-center gap-2 no-print">
                <Button variant="ghost" size="sm" onClick={() => startEditingWidget("monthly-volume", "Volumen por Mes")}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent"
                  onClick={() => {
                    exportChartAsImage("monthly-volume", "Volumen Mensual")
                    toast({ title: "Gráfico exportado", description: "La imagen se ha descargado correctamente" })
                  }}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <ReBarChart data={dashboardStats.chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 12 }} />
                  <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                  />
                  <Bar dataKey="count" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
                </ReBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ),
      },
      {
        id: "distribution",
        type: "chart",
        title: "Distribución por Sociedad",
        size: "medium",
        editable: true,
        component: (
          <Card className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-teal-800 dark:text-teal-200">
                  {editingWidget === "distribution" ? (
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="h-8"
                      onBlur={() => saveWidgetTitle("distribution")}
                      onKeyDown={(e) => e.key === "Enter" && saveWidgetTitle("distribution")}
                    />
                  ) : (
                    "Distribución por Sociedad"
                  )}
                </CardTitle>
                <CardDescription>Montos por empresa</CardDescription>
              </div>
              <div className="flex items-center gap-2 no-print">
                <Button variant="ghost" size="sm" onClick={() => startEditingWidget("distribution", "Distribución por Sociedad")}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent"
                  onClick={() => {
                    exportChartAsImage("distribution", "Distribución por Sociedad")
                    toast({ title: "Gráfico exportado", description: "La imagen se ha descargado correctamente" })
                  }}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <RePieChart>
                  <Pie
                    data={dashboardStats.pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {dashboardStats.pieData.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [formatCurrency(Number(value)), "Monto"]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                  />
                </RePieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ),
      },
      {
        id: "heatmap",
        type: "chart",
        title: "Mapa de Calor",
        size: "large",
        editable: true,
        component: (
          <Card className="bg-gradient-to-br from-rose-50 to-pink-100 dark:from-rose-900/20 dark:to-pink-800/20 h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-rose-800 dark:text-rose-200">
                  {editingWidget === "heatmap" ? (
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="h-8"
                      onBlur={() => saveWidgetTitle("heatmap")}
                      onKeyDown={(e) => e.key === "Enter" && saveWidgetTitle("heatmap")}
                    />
                  ) : (
                    "Mapa de Calor de Datos"
                  )}
                </CardTitle>
                <CardDescription>Intensidad de valores por registro</CardDescription>
              </div>
              <div className="flex items-center gap-2 no-print">
                <Button variant="ghost" size="sm" onClick={() => startEditingWidget("heatmap", "Mapa de Calor de Datos")}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent"
                  onClick={() => {
                    exportChartAsImage("heatmap", "Mapa de Calor")
                    toast({ title: "Gráfico exportado", description: "La imagen se ha descargado correctamente" })
                  }}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <HeatMapChart data={filteredData} />
            </CardContent>
          </Card>
        ),
      },

      // Tabla de datos (ya lo tenías)
      {
        id: "data-table",
        type: "table",
        title: "Tabla de Datos",
        size: "large",
        editable: true,
        component: (
          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-gray-800 dark:text-gray-200">
                  {editingWidget === "data-table" ? (
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="h-8"
                      onBlur={() => saveWidgetTitle("data-table")}
                      onKeyDown={(e) => e.key === "Enter" && saveWidgetTitle("data-table")}
                    />
                  ) : (
                    "Tabla de Datos"
                  )}
                </CardTitle>
                <CardDescription>Últimos 10 registros</CardDescription>
              </div>
              <div className="flex items-center gap-2 no-print">
                <Button variant="ghost" size="sm" onClick={() => startEditingWidget("data-table", "Tabla de Datos")}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent"
                  onClick={() => {
                    exportChartAsImage("data-table", "Tabla de Datos")
                    toast({ title: "Tabla exportada", description: "La imagen se ha descargado correctamente" })
                  }}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredData.slice(0, 10).map((row, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {(row.SociedadNombre || "").toString().length > 25
                          ? `${(row.SociedadNombre || "").toString().substring(0, 25)}...`
                          : row.SociedadNombre || "-"}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {(row.SociedadCodigo || row.codigo || "-") + " • " + (row._source || "").replace(".csv", "")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(Math.abs(row.MontoEstandarizado || 0))}
                      </p>
                    </div>
                  </div>
                ))}
                {filteredData.length > 10 && (
                  <div className="text-center pt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Y {(filteredData.length - 10).toLocaleString()} registros más...
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ),
      },

      // NUEVO: Listado de “Datos Recientes” (tomado del segundo dashboard)
      {
        id: "recent-list",
        type: "list",
        title: "Datos Recientes",
        size: "medium",
        editable: true,
        component: (
          <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-gray-200/50 dark:border-slate-700/50 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {editingWidget === "recent-list" ? (
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => saveWidgetTitle("recent-list")}
                    onKeyDown={(e) => e.key === "Enter" && saveWidgetTitle("recent-list")}
                    className="text-base font-semibold"
                    autoFocus
                  />
                ) : (
                  <span onClick={() => startEditingWidget("recent-list", "Datos Recientes")} className="cursor-pointer hover:text-blue-600">
                    Datos Recientes
                  </span>
                )}
              </CardTitle>
              <div className="flex items-center gap-2 no-print">
                <Button variant="ghost" size="sm" onClick={() => startEditingWidget("recent-list", "Datos Recientes")} className="h-8 w-8 p-0">
                  <Edit className="h-4 w-4" />
                </Button>
                <TableIcon className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredData.slice(0, 10).map((row, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {(row.SociedadNombre || "").toString().length > 25
                          ? `${(row.SociedadNombre || "").toString().substring(0, 25)}...`
                          : row.SociedadNombre || "-"}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {(row.SociedadCodigo || row.codigo || "-") + " • " + (row._source || "").replace(".csv", "")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(Math.abs(row.MontoEstandarizado || 0))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ),
      },
    ]
  }, [dashboardStats, toast, editingWidget, editTitle, filteredData])

  const onDragEnd = (result: any) => {
    if (!result.destination) return
    const items = Array.from(widgets.length > 0 ? widgets : defaultWidgets)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)
    setWidgets(items)
    toast({ title: "Dashboard actualizado", description: "Los widgets se han reorganizado correctamente" })
  }

  const addWidget = () => {
    if (!selectedWidgetId) return
    const widget = defaultWidgets.find((w) => w.id === selectedWidgetId)
    if (widget && !widgets.some((w) => w.id === selectedWidgetId)) {
      setWidgets([...widgets, widget])
      setSelectedWidgetId("")
      toast({ title: "Widget agregado", description: `${widget.title} se ha añadido al dashboard` })
    }
  }

  const exportDashboard = async () => {
    try {
      await exportDashboard()
      toast({ title: "Dashboard exportado", description: "El dashboard completo se ha exportado como PDF" })
    } catch {
      toast({ title: "Error al exportar", description: "No se pudo exportar el dashboard", variant: "destructive" })
    }
  }

  if (!dashboardStats) {
    return (
      <div className="text-center py-12">
        <div className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">Dashboard no disponible</div>
        <p className="text-gray-500 dark:text-gray-500">Carga algunos datos para ver el dashboard interactivo</p>
      </div>
    )
  }

  const currentWidgets = widgets.length > 0 ? widgets : defaultWidgets
  const availableToAdd = defaultWidgets.filter((w) => !widgets.some((widget) => widget.id === w.id))

  return (
    <div className="space-y-6" id="dashboard-section">
      {/* Encabezado y acciones */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Dashboard Ejecutivo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Vista general de tus datos financieros</p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Button
            onClick={exportDashboard}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 no-print"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar Dashboard
          </Button>

          {availableToAdd.length > 0 && (
            <div className="flex items-center gap-2 no-print">
              <Select value={selectedWidgetId} onValueChange={setSelectedWidgetId}>
                <SelectTrigger className="w-52">
                  <SelectValue placeholder="Agregar widget..." />
                </SelectTrigger>
                <SelectContent>
                  {availableToAdd.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={addWidget} disabled={!selectedWidgetId} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}

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
      </div>

      {/* Grid con drag & drop + icono Grip */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="dashboard">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 auto-rows-max"
            >
              {currentWidgets.map((widget, index) => (
                <Draggable key={widget.id} draggableId={widget.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`
                        ${widget.size === "small" ? "col-span-1" : ""}
                        ${widget.size === "medium" ? "col-span-1 sm:col-span-2" : ""}
                        ${widget.size === "large" ? "col-span-1 sm:col-span-2 lg:col-span-4" : ""}
                        ${snapshot.isDragging ? "rotate-1 scale-105 shadow-2xl z-50" : ""}
                        transition-all duration-200 chart-container
                      `}
                    >
                      <div className="relative group h-full">
                        {/* Icono para arrastrar */}
                        <div
                          {...provided.dragHandleProps}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10 no-print"
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
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  )
}
