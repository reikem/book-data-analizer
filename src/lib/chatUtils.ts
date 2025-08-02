// src/lib/chatUtils.ts
import type { ProcessedDataRow } from "./types/type"

// En dev puedes usar proxy de Vite a http://localhost:3001 (ver vite.config.ts)
// En prod usa una función serverless/endpoint y define VITE_CHAT_API_URL.
const CHAT_API_URL =
  import.meta.env.VITE_CHAT_API_URL?.toString() || "/api/chat"

type ChatApiResponse = { answer?: string; error?: string }

export async function askChatGPT(
  question: string,
  data: ProcessedDataRow[],
): Promise<string> {
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

    // Llamada a tu backend (NO se usa la API key aquí)
    const res = await fetch(CHAT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, dataSummary }),
    })

    if (!res.ok) {
      // Devuelve análisis local si la API no responde
      const text = await res.text().catch(() => "")
      throw new Error(`API error ${res.status} ${text}`)
    }

    const json = (await res.json()) as ChatApiResponse
    if (json?.answer) return json.answer

    // Si el backend no trae "answer", caemos al análisis local
    return generateLocalAnalysis(question, data)
  } catch (err) {
    console.error("askChatGPT fallback to local analysis:", err)
    return generateLocalAnalysis(question, data)
  }
}

function generateLocalAnalysis(question: string, data: ProcessedDataRow[]): string {
  const totalRecords = data.length
  const uniqueCompanies = [...new Set(data.map((row) => row.SociedadNombre))].length
  const totalAmount = data.reduce((sum, row) => sum + (row.MontoEstandarizado || 0), 0)

  const lower = question.toLowerCase()

  if (lower.includes("total") || lower.includes("suma")) {
    return `📊 **Análisis de totales:**

• **Total de registros**: ${totalRecords.toLocaleString()}
• **Monto total**: $${totalAmount.toLocaleString()}
• **Promedio por registro**: $${(totalAmount / Math.max(totalRecords,1)).toLocaleString()}
• **Empresas únicas**: ${uniqueCompanies}

**Distribución por empresa:**
${[...new Set(data.map((r) => r.SociedadNombre))]
  .slice(0, 5)
  .map((company) => {
    const rows = data.filter((r) => r.SociedadNombre === company)
    const sum = rows.reduce((s, r) => s + (r.MontoEstandarizado || 0), 0)
    return `• **${company}**: $${sum.toLocaleString()} (${rows.length} registros)`
  })
  .join("\n")}

*Análisis generado localmente — Chat no disponible.*`
  }

  if (lower.includes("empresa") || lower.includes("sociedad")) {
    const lines = [...new Set(data.map((r) => r.SociedadNombre))]
      .slice(0, 10)
      .map((company) => {
        const rows = data.filter((r) => r.SociedadNombre === company)
        const sum = rows.reduce((s, r) => s + (r.MontoEstandarizado || 0), 0)
        return `• **${company}**: ${rows.length} registros, $${sum.toLocaleString()}`
      })
      .join("\n")

    const top =
      [...new Set(data.map((r) => r.SociedadNombre))]
        .map((name) => ({
          name,
          count: data.filter((r) => r.SociedadNombre === name).length,
        }))
        .sort((a, b) => b.count - a.count)[0]?.name ?? "-"

    return `🏢 **Análisis por empresas:**

${lines}

**Resumen:**
- Total de empresas: ${uniqueCompanies}
- Empresa con más registros: ${top}

*Análisis generado localmente — Chat no disponible.*`
  }

  return `📊 **Resumen de datos:**

• **Total de registros**: ${totalRecords.toLocaleString()}
• **Empresas únicas**: ${uniqueCompanies}
• **Monto total**: $${totalAmount.toLocaleString()}
• **Fuentes de datos**: ${[...new Set(data.map((r) => r._source))].join(", ")}

**Análisis disponible:**
- Tendencias por empresa
- Comparativas de montos
- Distribución por fuentes
- Análisis temporal (si hay fechas)

¿Deseas profundizar en algo específico?

*Análisis generado localmente — Chat no disponible.*`
}

export function formatCurrency(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`
  if (Math.abs(amount) >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`
  return `$${amount.toFixed(2)}`
}
