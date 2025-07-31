import jsPDF from "jspdf"
import html2canvas from "html2canvas"

interface ReportConfig {
  companyName: string
  reportTitle: string
  charts: any[]
  chartTitles: Record<string, string>
  chartDescriptions: Record<string, string>
  aiContent?: any
}

export async function generatePDFReport(config: ReportConfig) {
  const pdf = new jsPDF("p", "mm", "a4")
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()

  try {
    
    pdf.setFillColor(41, 128, 185) 
    pdf.rect(0, 0, pageWidth, 60, "F")

    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(28)
    pdf.setFont("helvetica", "bold")
    pdf.text(config.reportTitle, pageWidth / 2, 35, { align: "center" })

    pdf.setFontSize(16)
    pdf.setFont("helvetica", "normal")
    pdf.text(config.companyName, pageWidth / 2, 45, { align: "center" })

    pdf.setTextColor(0, 0, 0)
    pdf.setFontSize(12)
    const currentDate = new Date()
    const monthNames = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ]
    const currentMonth = monthNames[currentDate.getMonth()]
    const currentYear = currentDate.getFullYear()

    pdf.text(`Balance Mensual - ${currentMonth} ${currentYear}`, pageWidth / 2, 80, { align: "center" })
    pdf.text(`Generado el ${currentDate.toLocaleDateString()}`, pageWidth / 2, 90, { align: "center" })

    // Professional footer on cover
    pdf.setFontSize(10)
    pdf.setTextColor(100, 100, 100)
    pdf.text("Informe Confidencial - Solo para uso interno", pageWidth / 2, pageHeight - 20, { align: "center" })

   
    if (config.aiContent) {
      pdf.addPage()

    
      pdf.setFillColor(52, 73, 94)
      pdf.rect(0, 0, pageWidth, 25, "F")
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(18)
      pdf.setFont("helvetica", "bold")
      pdf.text("Resumen Ejecutivo", 20, 17)

      let yPos = 40
      pdf.setTextColor(0, 0, 0)
      pdf.setFontSize(12)
      pdf.setFont("helvetica", "normal")

   
      pdf.setFont("helvetica", "bold")
      pdf.text("1. Introducción", 20, yPos)
      yPos += 10

      pdf.setFont("helvetica", "normal")
      const introLines = pdf.splitTextToSize(config.aiContent.introduction, pageWidth - 40)
      pdf.text(introLines, 20, yPos)
      yPos += introLines.length * 6 + 15

   
      pdf.setFont("helvetica", "bold")
      pdf.text("2. Hallazgos Principales", 20, yPos)
      yPos += 10

      pdf.setFont("helvetica", "normal")
      const summaryLines = pdf.splitTextToSize(config.aiContent.executiveSummary, pageWidth - 40)
      pdf.text(summaryLines, 20, yPos)
      yPos += summaryLines.length * 6 + 15

    
      if (yPos > pageHeight - 60) {
        pdf.addPage()
        yPos = 30
      }

      pdf.setFont("helvetica", "bold")
      pdf.text("3. Conclusiones y Recomendaciones", 20, yPos)
      yPos += 10

      pdf.setFont("helvetica", "normal")
      const conclusionLines = pdf.splitTextToSize(config.aiContent.conclusions, pageWidth - 40)
      pdf.text(conclusionLines, 20, yPos)
    }


    for (let i = 0; i < config.charts.length; i++) {
      const chart = config.charts[i]
      pdf.addPage()

      
      pdf.setFillColor(52, 73, 94)
      pdf.rect(0, 0, pageWidth, 25, "F")
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(16)
      pdf.setFont("helvetica", "bold")
      pdf.text(`Análisis ${i + 1}`, 20, 17)

    
      pdf.setTextColor(0, 0, 0)
      pdf.setFontSize(14)
      pdf.setFont("helvetica", "bold")
      const title = config.chartTitles[chart.id] || chart.title
      pdf.text(title, 20, 40)

    
      let descriptionHeight = 0
      if (config.chartDescriptions[chart.id]) {
        pdf.setFontSize(10)
        pdf.setFont("helvetica", "normal")
        const description = config.chartDescriptions[chart.id]
        const lines = pdf.splitTextToSize(description, pageWidth - 40)
        pdf.text(lines, 20, 50)
        descriptionHeight = lines.length * 4 + 10
      }


      const chartElement = document.getElementById(chart.id) || document.getElementById(`custom-chart-${chart.id}`)
      if (chartElement) {
        try {
          await new Promise((resolve) => setTimeout(resolve, 1000))

          const canvas = await html2canvas(chartElement, {
            backgroundColor: "white",
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false,
            width: chartElement.offsetWidth,
            height: chartElement.offsetHeight,
          })

          const imgData = canvas.toDataURL("image/png", 1.0)
          const imgWidth = pageWidth - 40
          const imgHeight = (canvas.height * imgWidth) / canvas.width
          const maxHeight = pageHeight - 80 - descriptionHeight

          const finalHeight = Math.min(imgHeight, maxHeight)
          const finalWidth = (canvas.width * finalHeight) / canvas.height

          pdf.addImage(imgData, "PNG", 20, 60 + descriptionHeight, finalWidth, finalHeight)
        } catch (error) {
          console.error("Error capturing chart:", error)
          pdf.setFontSize(12)
          pdf.text("Error al capturar el gráfico", 20, 80)
        }
      }

   
      pdf.setFontSize(8)
      pdf.setTextColor(100, 100, 100)
      pdf.text(
        `Página ${pdf.internal.getNumberOfPages()} | ${config.companyName} - ${currentMonth} ${currentYear}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" },
      )
    }

 
    pdf.save(`${config.companyName}_Balance_${currentMonth}_${currentYear}.pdf`)
    return true
  } catch (error) {
    console.error("Error generating PDF:", error)
    throw error
  }
}

export async function generatePPTPresentation(config: ReportConfig) {
  try {
    const currentDate = new Date()
    const monthNames = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ]
    const currentMonth = monthNames[currentDate.getMonth()]
    const currentYear = currentDate.getFullYear()

   
    const presentation = {
      title: config.reportTitle,
      company: config.companyName,
      period: `${currentMonth} ${currentYear}`,
      date: currentDate.toLocaleDateString(),
      slides: [],
    }

    presentation.slides.push({
      type: "cover",
      title: config.reportTitle,
      subtitle: config.companyName,
      period: `Balance Mensual - ${currentMonth} ${currentYear}`,
      date: `Generado el ${currentDate.toLocaleDateString()}`,
      template: "corporate_blue",
    })

   
    if (config.aiContent) {
      presentation.slides.push({
        type: "executive_summary",
        title: "Resumen Ejecutivo",
        sections: [
          {
            title: "Introducción",
            content: config.aiContent.introduction,
          },
          {
            title: "Hallazgos Principales",
            content: config.aiContent.executiveSummary,
          },
          {
            title: "Conclusiones",
            content: config.aiContent.conclusions,
          },
        ],
        template: "two_column",
      })
    }

   
    const chartImages = []
    for (const chart of config.charts) {
      const chartElement = document.getElementById(chart.id) || document.getElementById(`custom-chart-${chart.id}`)
      let chartImage = null

      if (chartElement) {
        try {
          await new Promise((resolve) => setTimeout(resolve, 500))

          const canvas = await html2canvas(chartElement, {
            backgroundColor: "white",
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false,
          })
          chartImage = canvas.toDataURL("image/png", 1.0)
        } catch (error) {
          console.error("Error capturing chart:", error)
        }
      }

      const slideData = {
        type: "chart_analysis",
        title: config.chartTitles[chart.id] || chart.title,
        description: config.chartDescriptions[chart.id] || "",
        chartImage: chartImage,
        chartType: chart.type,
        template: "chart_focus",
        insights: [
          "Análisis de tendencias identificadas",
          "Variaciones significativas del período",
          "Recomendaciones basadas en los datos",
        ],
      }

      presentation.slides.push(slideData)
      chartImages.push(slideData)
    }

    // Conclusions slide
    presentation.slides.push({
      type: "conclusions",
      title: "Conclusiones y Próximos Pasos",
      content: [
        "Resumen de hallazgos principales",
        "Recomendaciones estratégicas",
        "Plan de acción para el próximo período",
      ],
      template: "bullet_points",
    })

    // Generate enhanced PPTX content
    const pptxContent = generateEnhancedPPTXContent(presentation)

    // Create downloadable PPTX file
    const blob = new Blob([pptxContent], {
      type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    })

    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `${config.companyName}_Balance_${currentMonth}_${currentYear}.pptx`
    link.click()

    return true
  } catch (error) {
    console.error("Error generating PPT:", error)
    throw error
  }
}

function generateEnhancedPPTXContent(presentation: any): string {
  const slides = presentation.slides
    .map((slide: any, index: number) => {
      if (slide.type === "cover") {
        return `
        <slide layout="title_slide" background="corporate_blue">
          <title style="font-size:44px;color:#2980b9;font-weight:bold">${slide.title}</title>
          <subtitle style="font-size:32px;color:#34495e">${slide.subtitle}</subtitle>
          <period style="font-size:24px;color:#7f8c8d">${slide.period}</period>
          <date style="font-size:16px;color:#95a5a6">${slide.date}</date>
          <footer>Confidencial - Solo para uso interno</footer>
        </slide>
      `
      } else if (slide.type === "executive_summary") {
        return `
        <slide layout="content" background="light_gray">
          <header style="background:#34495e;color:white;padding:20px">
            <title>${slide.title}</title>
          </header>
          <content style="padding:30px">
            ${slide.sections
              .map(
                (section: any) => `
              <section>
                <h3 style="color:#2980b9;margin-bottom:15px">${section.title}</h3>
                <p style="line-height:1.6;margin-bottom:25px">${section.content}</p>
              </section>
            `,
              )
              .join("")}
          </content>
        </slide>
      `
      } else if (slide.type === "chart_analysis") {
        return `
        <slide layout="chart_focus" background="white">
          <header style="background:#34495e;color:white;padding:15px">
            <title>${slide.title}</title>
          </header>
          <main_content style="display:flex;padding:20px">
            <chart_area style="width:70%;padding-right:20px">
              ${slide.chartImage ? `<image src="${slide.chartImage}" style="width:100%;height:auto;border:1px solid #ddd" />` : "<placeholder>Gráfico no disponible</placeholder>"}
            </chart_area>
            <analysis_area style="width:30%;background:#f8f9fa;padding:20px;border-radius:8px">
              <h4 style="color:#2980b9;margin-bottom:15px">Análisis</h4>
              <p style="font-size:14px;line-height:1.5;margin-bottom:15px">${slide.description}</p>
              <h5 style="color:#34495e;margin-bottom:10px">Insights Clave:</h5>
              <ul style="font-size:12px;line-height:1.4">
                ${slide.insights?.map((insight: string) => `<li style="margin-bottom:8px">${insight}</li>`).join("") || ""}
              </ul>
            </analysis_area>
          </main_content>
        </slide>
      `
      } else if (slide.type === "conclusions") {
        return `
        <slide layout="bullet_points" background="light_blue">
          <header style="background:#2980b9;color:white;padding:20px">
            <title>${slide.title}</title>
          </header>
          <content style="padding:40px">
            <ul style="font-size:20px;line-height:2">
              ${slide.content
                .map(
                  (item: string) => `
                <li style="margin-bottom:20px;padding-left:20px;position:relative">
                  <span style="position:absolute;left:0;color:#2980b9">▶</span>
                  ${item}
                </li>
              `,
                )
                .join("")}
            </ul>
          </content>
        </slide>
      `
      }
      return ""
    })
    .join("")

  return `<?xml version="1.0" encoding="UTF-8"?>
<presentation xmlns="http://schemas.openxmlformats.org/presentationml/2006/main" 
               xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <metadata>
    <title>${presentation.title}</title>
    <company>${presentation.company}</company>
    <period>${presentation.period}</period>
    <date>${presentation.date}</date>
    <theme>corporate_professional</theme>
  </metadata>
  <slidemaster>
    <colors>
      <primary>#2980b9</primary>
      <secondary>#34495e</secondary>
      <accent>#e74c3c</accent>
      <background>#ffffff</background>
      <text>#2c3e50</text>
    </colors>
    <fonts>
      <title>Calibri Bold</title>
      <body>Calibri</body>
    </fonts>
  </slidemaster>
  <slides>
    ${slides}
  </slides>
  <notes>
    <note>Esta presentación contiene información confidencial del balance mensual</note>
    <note>Los gráficos y análisis están basados en datos reales del período</note>
    <note>Para más detalles, consultar el informe PDF completo</note>
  </notes>
</presentation>`
}
