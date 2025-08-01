import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { FileText, Presentation, Loader2, Sparkles } from "lucide-react"
import { useDataStore } from "@/lib/store"
import { generateReportContent } from "@/lib/aiReportGenerator"
import { generatePDFReport, generatePPTPresentation } from "@/lib/reportUtils"


export function ReportGenerator() {
  const { charts, data, selectedCompanies } = useDataStore()
  const [companyName, setCompanyName] = useState("")
  const [reportTitle, setReportTitle] = useState("")
  const [selectedCharts, setSelectedCharts] = useState<string[]>([])
  const [chartTitles, setChartTitles] = useState<Record<string, string>>({})
  const [chartDescriptions, setChartDescriptions] = useState<Record<string, string>>({})
  const [generating, setGenerating] = useState<string | null>(null)
  const [aiContent, setAiContent] = useState<any>(null)

  const aiContentMutation = useMutation({
    mutationFn: () =>
      generateReportContent(
        data,
        selectedCompanies,
        charts.filter((c) => selectedCharts.includes(c.id)),
      ),
    onSuccess: (content) => {
      setAiContent(content)
      setReportTitle(content.title)
      // Update chart titles and descriptions with AI suggestions
      content.sections.forEach((section: any) => {
        if (section.chartId) {
          setChartTitles((prev) => ({ ...prev, [section.chartId]: section.title }))
          setChartDescriptions((prev) => ({ ...prev, [section.chartId]: section.analysis }))
        }
      })
    },
  })

  const toggleChart = (chartId: string) => {
    setSelectedCharts((prev) => (prev.includes(chartId) ? prev.filter((id) => id !== chartId) : [...prev, chartId]))
  }

  const updateChartTitle = (chartId: string, title: string) => {
    setChartTitles((prev) => ({ ...prev, [chartId]: title }))
  }

  const updateChartDescription = (chartId: string, description: string) => {
    setChartDescriptions((prev) => ({ ...prev, [chartId]: description }))
  }

  const generatePDF = async () => {
    if (!companyName || selectedCharts.length === 0) return

    setGenerating("pdf")
    try {
      await generatePDFReport({
        companyName,
        reportTitle: reportTitle || "Informe de Análisis de Datos",
        charts: charts.filter((chart) => selectedCharts.includes(chart.id)),
        chartTitles,
        chartDescriptions,
        aiContent,
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
    } finally {
      setGenerating(null)
    }
  }

  const generatePPT = async () => {
    if (!companyName || selectedCharts.length === 0) return

    setGenerating("ppt")
    try {
      await generatePPTPresentation({
        companyName,
        reportTitle: reportTitle || "Presentación de Análisis de Datos",
        charts: charts.filter((chart) => selectedCharts.includes(chart.id)),
        chartTitles,
        chartDescriptions,
        aiContent,
      })
    } catch (error) {
      console.error("Error generating PPT:", error)
    } finally {
      setGenerating(null)
    }
  }

  if (charts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 flex items-center justify-center mb-4">
          <FileText className="h-8 w-8 text-indigo-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">Generador de Informes</h3>
        <p className="text-gray-500 dark:text-gray-500">Crea algunos gráficos primero para generar informes</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Generador de Informes
        </h1>
        <p className="text-gray-600 dark:text-gray-400">Crea informes profesionales con análisis de IA</p>
      </div>

      {/* Company Information */}
      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Información de la Empresa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="company-name">Nombre de la Empresa *</Label>
            <Input
              id="company-name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Ingresa el nombre de la empresa"
            />
          </div>
          <div>
            <Label htmlFor="report-title">Título del Informe</Label>
            <Input
              id="report-title"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              placeholder="Informe de Análisis de Datos"
            />
          </div>
        </CardContent>
      </Card>

      {/* Chart Selection */}
      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Seleccionar Gráficos</CardTitle>
          <Button
            onClick={() => aiContentMutation.mutate()}
            disabled={selectedCharts.length === 0 || aiContentMutation.isPending}
            variant="outline"
            className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20"
          >
            {aiContentMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Generar Contenido con IA
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {charts.map((chart) => (
            <div key={chart.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={chart.id}
                  checked={selectedCharts.includes(chart.id)}
                  onCheckedChange={() => toggleChart(chart.id)}
                />
                <Label htmlFor={chart.id} className="font-medium">
                  {chart.title}
                </Label>
              </div>

              {selectedCharts.includes(chart.id) && (
                <div className="ml-6 space-y-3">
                  <div>
                    <Label htmlFor={`title-${chart.id}`}>Título personalizado</Label>
                    <Input
                      id={`title-${chart.id}`}
                      value={chartTitles[chart.id] || chart.title}
                      onChange={(e) => updateChartTitle(chart.id, e.target.value)}
                      placeholder="Título del gráfico en el informe"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`desc-${chart.id}`}>Análisis y descripción</Label>
                    <Textarea
                      id={`desc-${chart.id}`}
                      value={chartDescriptions[chart.id] || ""}
                      onChange={(e) => updateChartDescription(chart.id, e.target.value)}
                      placeholder="Análisis detallado del gráfico (se generará automáticamente con IA)"
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* AI Generated Content Preview */}
      {aiContent && (
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
              <Sparkles className="h-5 w-5" />
              Contenido Generado por IA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-purple-800 dark:text-purple-200">Introducción:</h4>
              <p className="text-sm text-purple-700 dark:text-purple-300">{aiContent.introduction}</p>
            </div>
            <div>
              <h4 className="font-medium text-purple-800 dark:text-purple-200">Resumen Ejecutivo:</h4>
              <p className="text-sm text-purple-700 dark:text-purple-300">{aiContent.executiveSummary}</p>
            </div>
            <div>
              <h4 className="font-medium text-purple-800 dark:text-purple-200">Conclusiones:</h4>
              <p className="text-sm text-purple-700 dark:text-purple-300">{aiContent.conclusions}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate Reports */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-700 dark:text-blue-300">
              <FileText className="h-5 w-5" />
              <span>Generar PDF</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-600 dark:text-blue-400 mb-4">
              Crea un informe PDF profesional con análisis de IA
            </p>
            <Button
              onClick={generatePDF}
              disabled={!companyName || selectedCharts.length === 0 || generating === "pdf"}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
            >
              {generating === "pdf" ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                "Generar PDF"
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-700 dark:text-green-300">
              <Presentation className="h-5 w-5" />
              <span>Generar PPT</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-600 dark:text-green-400 mb-4">
              Crea una presentación PowerPoint con contenido inteligente
            </p>
            <Button
              onClick={generatePPT}
              disabled={!companyName || selectedCharts.length === 0 || generating === "ppt"}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              {generating === "ppt" ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                "Generar PPT"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {selectedCharts.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          <p>{selectedCharts.length} gráfico(s) seleccionado(s) para el informe</p>
        </div>
      )}
    </div>
  )
}