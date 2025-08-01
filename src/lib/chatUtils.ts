import type { ProcessedDataRow } from "./types/type"

const OPENAI_API_KEY ="";
export async function askChatGPT(question: string, data: ProcessedDataRow[]): Promise<string> {
  try {
   
    const dataSummary = {
      totalRecords: data.length,
      companies: [...new Set(data.map((row) => row.SociedadNombre))],
      sources: [...new Set(data.map((row) => row._source))],
      totalAmount: data.reduce((sum, row) => sum + (row.MontoEstandarizado || 0), 0),
      sampleData: data.slice(0, 5).map((row) => ({
        sociedad: row.SociedadNombre,
        monto: row.MontoEstandarizado,
        fuente: row._source,
      })),
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `Eres un asistente de análisis financiero. Tienes acceso a datos financieros con la siguiente información:
            - Total de registros: ${dataSummary.totalRecords}
            - Empresas: ${dataSummary.companies.join(", ")}
            - Fuentes de datos: ${dataSummary.sources.join(", ")}
            - Monto total: $${dataSummary.totalAmount.toLocaleString()}
            
            Responde en español y proporciona análisis útiles basados en los datos disponibles.`,
          },
          {
            role: "user",
            content: `${question}\n\nDatos de muestra: ${JSON.stringify(dataSummary.sampleData, null, 2)}`,
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(`Error de API: ${response.status}`)
    }

    const result = await response.json()
    return result.choices[0]?.message?.content || "No se pudo obtener respuesta"
  } catch (error) {
    console.error("Error en ChatGPT:", error)
    return generateLocalAnalysis(question, data)
  }
}

function generateLocalAnalysis(question: string, data: ProcessedDataRow[]): string {
  const totalRecords = data.length
  const uniqueCompanies = [...new Set(data.map((row) => row.SociedadNombre))].length
  const totalAmount = data.reduce((sum, row) => sum + (row.MontoEstandarizado || 0), 0)

  const lowerQuestion = question.toLowerCase()

  if (lowerQuestion.includes("total") || lowerQuestion.includes("suma")) {
    return `📊 **Análisis de totales:**

• **Total de registros**: ${totalRecords.toLocaleString()}
• **Monto total**: $${totalAmount.toLocaleString()}
• **Promedio por registro**: $${(totalAmount / totalRecords).toLocaleString()}
• **Empresas únicas**: ${uniqueCompanies}

**Distribución por empresa:**
${[...new Set(data.map((row) => row.SociedadNombre))]
  .slice(0, 5)
  .map((company) => {
    const companyData = data.filter((row) => row.SociedadNombre === company)
    const companyTotal = companyData.reduce((sum, row) => sum + (row.MontoEstandarizado || 0), 0)
    return `• **${company}**: $${companyTotal.toLocaleString()} (${companyData.length} registros)`
  })
  .join("\n")}

*Análisis generado localmente - ChatGPT no disponible*`
  }

  if (lowerQuestion.includes("empresa") || lowerQuestion.includes("sociedad")) {
    const companiesAnalysis = [...new Set(data.map((row) => row.SociedadNombre))]
      .slice(0, 10)
      .map((company) => {
        const companyData = data.filter((row) => row.SociedadNombre === company)
        const companyTotal = companyData.reduce((sum, row) => sum + (row.MontoEstandarizado || 0), 0)
        return `• **${company}**: ${companyData.length} registros, $${companyTotal.toLocaleString()}`
      })
      .join("\n")

    return `🏢 **Análisis por empresas:**

${companiesAnalysis}

**Resumen:**
- Total de empresas: ${uniqueCompanies}
- Empresa con más registros: ${
      [...new Set(data.map((row) => row.SociedadNombre))]
        .map((company) => ({
          name: company,
          count: data.filter((row) => row.SociedadNombre === company).length,
        }))
        .sort((a, b) => b.count - a.count)[0]?.name
    }

*Análisis generado localmente - ChatGPT no disponible*`
  }

  return `📊 **Resumen de datos:**

• **Total de registros**: ${totalRecords.toLocaleString()}
• **Empresas únicas**: ${uniqueCompanies}
• **Monto total**: $${totalAmount.toLocaleString()}
• **Fuentes de datos**: ${[...new Set(data.map((row) => row._source))].join(", ")}

**Análisis disponible:**
- Tendencias por empresa
- Comparativas de montos
- Distribución por fuentes
- Análisis temporal (si hay fechas)

¿Te gustaría que profundice en algún aspecto específico?

*Análisis generado localmente - ChatGPT no disponible*`
}

export function formatCurrency(amount: number): string {
  if (Math.abs(amount) >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`
  } else if (Math.abs(amount) >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`
  }
  return `$${amount.toFixed(2)}`
}
