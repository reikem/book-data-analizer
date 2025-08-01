import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download,  Plus } from "lucide-react"
import { useDataStore } from "@/lib/store"
import { exportChartAsImage } from "@/lib/ chartExport"
import { KPICard } from "./KpiCard"
import { MultiFieldChart } from "./MultiFieldChart"
import { ProfitabilityChart } from "./ProfitabilityChart"
import { LineChart } from "./LineChart"


interface ChartConfig {
  id: string
  type: string
  title: string
  xAxis: string
  yAxis: string
  description: string
}

export function ChartGenerator() {
  const { data, selectedCompanies, charts, addChart } = useDataStore()
  const [chartType, setChartType] = useState("line")
  const [chartTitle, setChartTitle] = useState("")
  const [xAxis, setXAxis] = useState("")
  const [yAxis, setYAxis] = useState("")
  const [description, setDescription] = useState("")

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

  const columns = useMemo(() => {
    if (filteredData.length === 0) return []
    return Object.keys(filteredData[0]).filter(
      (key) => !key.startsWith("_") && key !== "RelatedRecords" && key !== "RelatedSources",
    )
  }, [filteredData])

  const numericColumns = useMemo(() => {
    return columns.filter((col) => {
      const sample = filteredData.slice(0, 10)
      return sample.some((row) => {
        const value = row[col]
        if (typeof value === "string") {
          const numValue = Number.parseFloat(value.replace(/[^\d.-]/g, ""))
          return !isNaN(numValue)
        }
        return !isNaN(Number.parseFloat(value)) && isFinite(value)
      })
    })
  }, [columns, filteredData])

  const createChart = () => {
    if (!chartTitle || !xAxis) return

    const newChart: ChartConfig = {
      id: Date.now().toString(),
      type: chartType,
      title: chartTitle,
      xAxis,
      yAxis: yAxis || "",
      description,
    }

    addChart(newChart)

    // Reset form
    setChartTitle("")
    setXAxis("")
    setYAxis("")
    setDescription("")
  }

  const renderChart = (chart: ChartConfig) => {
    const commonProps = {
      data: filteredData,
      xKey: chart.xAxis,
      yKey: chart.yAxis,
      title: chart.title,
    }

    switch (chart.type) {
      case "line":
        return <MultiFieldChart {...commonProps} type="line" availableFields={numericColumns} />
      case "bar":
        return <MultiFieldChart {...commonProps} type="bar" availableFields={numericColumns} />
      case "kpi":
        return <KPICard data={filteredData} metric={chart.yAxis || numericColumns[0]} />
      case "profitability":
        return <ProfitabilityChart data={filteredData} />
      default:
        return <LineChart {...commonProps} />
    }
  }

  if (filteredData.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No hay datos disponibles para generar gráficos.</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
          Generador de Gráficos
        </h1>
        <p className="text-gray-600 dark:text-gray-400">Crea visualizaciones interactivas con múltiples campos</p>
      </div>

      {/* Chart Creation Form */}
      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Crear Nuevo Gráfico</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="chart-type">Tipo de Gráfico</Label>
              <Select value={chartType} onValueChange={setChartType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Líneas (Multi-campo)</SelectItem>
                  <SelectItem value="bar">Barras (Multi-campo)</SelectItem>
                  <SelectItem value="kpi">KPI</SelectItem>
                  <SelectItem value="profitability">Rentabilidad</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="x-axis">Eje X</Label>
              <Select value={xAxis} onValueChange={setXAxis}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar columna" />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="chart-title">Título</Label>
              <Input
                id="chart-title"
                value={chartTitle}
                onChange={(e) => setChartTitle(e.target.value)}
                placeholder="Título del gráfico"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción del gráfico"
            />
          </div>

          <Button onClick={createChart} disabled={!chartTitle || !xAxis}>
            <Plus className="h-4 w-4 mr-2" />
            Crear Gráfico
          </Button>
        </CardContent>
      </Card>

      {/* Generated Charts */}
      {charts.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Gráficos Generados</h3>
          {charts.map((chart) => (
            <Card key={chart.id} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{chart.title}</CardTitle>
                  {chart.description && <p className="text-sm text-muted-foreground mt-1">{chart.description}</p>}
                </div>
                <Button variant="outline" size="sm" onClick={() => exportChartAsImage(chart.id, chart.title)}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </CardHeader>
              <CardContent>
                <div id={chart.id}>{renderChart(chart)}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
