export async function generateReportContent(data: any[], selectedCompanies: string[], charts: any[]) {

    await new Promise((resolve) => setTimeout(resolve, 2000))
  
    const totalRecords = data.length
    const companiesAnalyzed = selectedCompanies.length || "todas las sociedades"
    const chartsCount = charts.length

    const amounts = data.map((row) => row.MontoEstandarizado || 0).filter((val) => !isNaN(val))
    const totalAmount = amounts.reduce((sum, val) => sum + val, 0)
    const avgAmount = amounts.length > 0 ? totalAmount / amounts.length : 0
  
    const content = {
      title: `Informe Ejecutivo de Análisis Financiero - ${new Date().getFullYear()}`,
      introduction: `Este informe presenta un análisis detallado de los datos financieros de ${companiesAnalyzed}, basado en ${totalRecords.toLocaleString()} registros procesados. El análisis incluye ${chartsCount} visualizaciones que permiten identificar tendencias, patrones y oportunidades de mejora en la gestión financiera.`,
  
      executiveSummary: `Los datos analizados revelan un monto total de $${Math.abs(totalAmount).toLocaleString()} con un promedio de $${Math.abs(avgAmount).toFixed(2)} por registro. ${totalAmount >= 0 ? "Los resultados muestran una tendencia positiva" : "Se identifican áreas que requieren atención"} en la gestión financiera. Las visualizaciones presentadas proporcionan insights clave para la toma de decisiones estratégicas.`,
  
      conclusions: `Basado en el análisis realizado, se recomienda: 1) Continuar monitoreando las métricas clave identificadas, 2) Implementar controles adicionales en las áreas de mayor variabilidad, 3) Aprovechar las tendencias positivas identificadas para optimizar la gestión financiera. Este informe debe ser revisado periódicamente para mantener la relevancia de los insights presentados.`,
  
      sections: charts.map((chart, index) => ({
        chartId: chart.id,
        title: `${chart.title} - Análisis Detallado`,
        analysis: `Este gráfico muestra la evolución de ${chart.yAxis || "las métricas seleccionadas"} en función de ${chart.xAxis}. Los datos revelan patrones importantes que indican ${index % 2 === 0 ? "una tendencia de crecimiento" : "variabilidad en los resultados"} que requiere atención gerencial. Las fluctuaciones observadas pueden estar relacionadas con factores estacionales o cambios en las políticas operativas.`,
        recommendations: `Se recomienda ${index % 3 === 0 ? "implementar controles adicionales" : index % 3 === 1 ? "aprovechar las oportunidades identificadas" : "monitorear de cerca esta métrica"} para optimizar los resultados futuros.`,
      })),
    }
  
    return content
  }
  