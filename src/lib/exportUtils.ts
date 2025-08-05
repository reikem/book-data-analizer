import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import type { ProcessedDataRow, ChartConfig, ExportOptions } from "./types/type"
import { title } from "process"

export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) return

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header]
          return typeof value === "string" && value.includes(",") ? `"${value}"` : value
        })
        .join(","),
    ),
  ].join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
}

export function exportToSQL(data: any[], filename: string) {
  if (data.length === 0) return

  const tableName = "datos_importados"
  const headers = Object.keys(data[0])

  // Create table statement
  const createTable = `CREATE TABLE ${tableName} (\n${headers
    .map((header) => `  ${header.replace(/\s+/g, "_")} VARCHAR(255)`)
    .join(",\n")}\n);\n\n`

  // Insert statements
  const insertStatements = data
    .map((row) => {
      const values = headers
        .map((header) => {
          const value = row[header]
          return typeof value === "string" ? `'${value.replace(/'/g, "''")}'` : value
        })
        .join(", ")
      return `INSERT INTO ${tableName} (${headers.map((h) => h.replace(/\s+/g, "_")).join(", ")}) VALUES (${values});`
    })
    .join("\n")

  const sqlContent = createTable + insertStatements

  const blob = new Blob([sqlContent], { type: "text/sql;charset=utf-8;" })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
}

export function exportToPowerBI(data: any[], filename: string) {
  // For PowerBI, we'll export as CSV with specific formatting
  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join("\t"), // Tab-separated for better PowerBI import
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header]
          return value?.toString().replace(/\t/g, " ") || ""
        })
        .join("\t"),
    ),
  ].join("\n")

  const blob = new Blob([csvContent], { type: "text/tab-separated-values;charset=utf-8;" })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = filename.replace(".pbix", ".txt")
  link.click()
}

export async function exportToPDF(
  data: ProcessedDataRow[],
  charts: ChartConfig[],
  options: ExportOptions,
): Promise<void> {
  const title = options.title || "Informe Financiero"
  const pdf = new jsPDF("p", "mm", "a4")
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 20
  let yPosition = margin

  // Title
  pdf.setFontSize(20)
  pdf.setFont("helvetica", "bold")

  pdf.text(title, margin, yPosition)
  yPosition += 15

  // Executive Summary
  pdf.setFontSize(16)
  pdf.setFont("helvetica", "bold")
  pdf.text("Resumen Ejecutivo", margin, yPosition)
  yPosition += 10

  pdf.setFontSize(12)
  pdf.setFont("helvetica", "normal")
  const summary = `Este informe presenta un análisis detallado de los datos financieros de ${
    [...new Set(data.map((row) => row.SociedadNombre))].length
  } sociedades, basado en ${data.length.toLocaleString()} registros procesados. El análisis incluye ${
    charts.length
  } visualizaciones que permiten identificar tendencias, patrones y oportunidades de mejora en la gestión financiera.`

  const summaryLines = pdf.splitTextToSize(summary, pageWidth - 2 * margin)
  pdf.text(summaryLines, margin, yPosition)
  yPosition += summaryLines.length * 5 + 10

  // Main Analysis
  pdf.setFontSize(16)
  pdf.setFont("helvetica", "bold")
  pdf.text("Análisis Principal", margin, yPosition)
  yPosition += 10

  const totalAmount = data.reduce((sum, row) => sum + (row.MontoEstandarizado || 0), 0)
  const avgAmount = totalAmount / data.length

  pdf.setFontSize(12)
  pdf.setFont("helvetica", "normal")
  const analysis = `Los datos analizados revelan un monto total de $${totalAmount.toLocaleString()} con un promedio de $${avgAmount.toFixed(2)} por registro. Los resultados muestran una tendencia positiva en la gestión financiera. Las visualizaciones presentadas proporcionan insights clave para la toma de decisiones estratégicas.`

  const analysisLines = pdf.splitTextToSize(analysis, pageWidth - 2 * margin)
  pdf.text(analysisLines, margin, yPosition)
  yPosition += analysisLines.length * 5 + 15

  if (options.includeCharts && charts.length > 0) {
    // Capture charts
    for (let i = 0; i < charts.length; i++) {
      const chartElement = document.getElementById(`chart-${charts[i].id}`)
      if (chartElement) {
        try {
          // Wait for chart to render
          await new Promise((resolve) => setTimeout(resolve, 1000))

          const canvas = await html2canvas(chartElement, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#ffffff",
            width: chartElement.offsetWidth,
            height: chartElement.offsetHeight + 100, // Extra space for title and description
            scrollX: 0,
            scrollY: 0,
          })

          const imgData = canvas.toDataURL("image/png")
          const imgWidth = pageWidth - 2 * margin
          const imgHeight = (canvas.height * imgWidth) / canvas.width

          // Check if we need a new page
          if (yPosition + imgHeight > pageHeight - margin) {
            pdf.addPage()
            yPosition = margin
          }

          // Add chart title
          pdf.setFontSize(14)
          pdf.setFont("helvetica", "bold")
          pdf.text(charts[i].title, margin, yPosition)
          yPosition += 10

          // Add chart description
          pdf.setFontSize(10)
          pdf.setFont("helvetica", "normal")
          pdf.text(charts[i].description, margin, yPosition)
          yPosition += 10

          // Add chart image
          pdf.addImage(imgData, "PNG", margin, yPosition, imgWidth, imgHeight)
          yPosition += imgHeight + 15
        } catch (error) {
          console.error(`Error capturing chart ${charts[i].id}:`, error)
        }
      }
    }
  }

  // Add data table if requested
  if (options.includeTable) {
    if (yPosition > pageHeight - 100) {
      pdf.addPage()
      yPosition = margin
    }

    pdf.setFontSize(16)
    pdf.setFont("helvetica", "bold")
    pdf.text("Datos de Muestra", margin, yPosition)
    yPosition += 15

    // Table headers
    const headers = ["Sociedad", "Código", "Monto", "Fuente"]
    const colWidth = (pageWidth - 2 * margin) / headers.length

    pdf.setFontSize(10)
    pdf.setFont("helvetica", "bold")
    headers.forEach((header, index) => {
      pdf.text(header, margin + index * colWidth, yPosition)
    })
    yPosition += 8

    // Table data (first 20 rows)
    pdf.setFont("helvetica", "normal")
    data.slice(0, 20).forEach((row) => {
      const rowData = [
        row.SociedadNombre.length > 15 ? row.SociedadNombre.substring(0, 15) + "..." : row.SociedadNombre,
        row.SociedadCodigo,
        (row.MontoEstandarizado || 0).toLocaleString(),
        row._source.length > 10 ? row._source.substring(0, 10) + "..." : row._source,
      ]

      rowData.forEach((cell, index) => {
        pdf.text(cell.toString(), margin + index * colWidth, yPosition)
      })
      yPosition += 6

      if (yPosition > pageHeight - margin) {
        pdf.addPage()
        yPosition = margin
      }
    })
  }

  // Save PDF
  pdf.save(`${title.toLowerCase().replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`)
}

export async function exportToPPTX(
  data: ProcessedDataRow[],
  charts: ChartConfig[],
  options: ExportOptions,
): Promise<void> {
  const chartImages: string[] = []

  // Capture charts as images
  if (options.includeCharts) {
    for (const chart of charts) {
      const chartElement = document.getElementById(`chart-${chart.id}`)
      if (chartElement) {
        try {
          await new Promise((resolve) => setTimeout(resolve, 1000))

          const canvas = await html2canvas(chartElement, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#ffffff",
            width: chartElement.offsetWidth,
            height: chartElement.offsetHeight + 100,
          })

          chartImages.push(canvas.toDataURL("image/png"))
        } catch (error) {
          console.error(`Error capturing chart ${chart.id}:`, error)
        }
      }
    }
  }

  // Create PPTX structure
  const pptxContent = createPPTXContent(data, charts, chartImages, options)

  // Create and download PPTX file
  const blob = new Blob([pptxContent], {
    type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${title.toLowerCase().replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.ppt`
  link.click()
  URL.revokeObjectURL(url)
}

function createPPTXContent(
  data: ProcessedDataRow[],
  charts: ChartConfig[],
  chartImages: string[],
  options: ExportOptions,
): string {
  // This is a simplified PPTX structure
  // In a real implementation, you would use a library like PptxGenJS
  const totalAmount = data.reduce((sum, row) => sum + (row.MontoEstandarizado || 0), 0)
  const companies = [...new Set(data.map((row) => row.SociedadNombre))]

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<presentation xmlns="http://schemas.openxmlformats.org/presentationml/2006/main">
  <slide>
    <title>${options.title}</title>
    <content>
      <h1>Resumen Ejecutivo</h1>
      <p>Total de registros: ${data.length.toLocaleString()}</p>
      <p>Sociedades analizadas: ${companies.length}</p>
      <p>Monto total: $${totalAmount.toLocaleString()}</p>
      <p>Gráficos incluidos: ${charts.length}</p>
    </content>
  </slide>
  ${charts
    .map(
      (chart, index) => `
  <slide>
    <title>${chart.title}</title>
    <content>
      <p>${chart.description}</p>
      ${chartImages[index] ? `<image src="${chartImages[index]}" />` : ""}
    </content>
  </slide>
  `,
    )
    .join("")}
</presentation>`
}
