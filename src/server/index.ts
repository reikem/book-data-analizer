// src/server/index.ts
import "dotenv/config"
import express from "express"
import cors from "cors"

const app = express()
const PORT = process.env.PORT || 8787

// a) Opcional: dominios desde .env (ALLOWED_ORIGINS separado por coma)
const ENV_ORIGINS = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean)

// b) O usa una lista fija (reemplaza <tu-usuario> / <tu-repo>)
const STATIC_ORIGINS = [
  "http://localhost:5173",
  "https://<tu-usuario>.github.io",
  "https://<tu-usuario>.github.io/<tu-repo>",
]

const ALLOWED_ORIGINS = ENV_ORIGINS.length ? ENV_ORIGINS : STATIC_ORIGINS

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true) // Postman, curl, etc.
    const ok = ALLOWED_ORIGINS.some(o => origin.startsWith(o))
    return ok ? cb(null, true) : cb(new Error("Not allowed by CORS"))
  },
}))

// Límite para evitar payloads enormes
app.use(express.json({ limit: "2mb" }))

app.get("/", (_req, res) => res.send("API OK"))

app.post("/ask", async (req, res) => {
  try {
    const { question, data, companies } = req.body || {}

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Falta OPENAI_API_KEY" })
    }

    // Recorta muestra y proyecta columnas clave
    const sample = Array.isArray(data) ? data.slice(0, 150).map((r: any) => ({
      SociedadNombre: r.SociedadNombre,
      SociedadCodigo: r.SociedadCodigo,
      MontoEstandarizado: r.MontoEstandarizado,
      _source: r._source,
    })) : []

    // Timeout sencillo (opcional)
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 25_000)

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3,
        messages: [
          { role: "system", content: "Eres analista financiero. Responde claro y en español." },
          {
            role: "user",
            content:
              `Pregunta: ${question}\n` +
              `Sociedades: ${Array.isArray(companies) && companies.length ? companies.join(", ") : "todas"}\n` +
              `Muestra (recortada): ${JSON.stringify(sample)}`,
          },
        ],
      }),
    }).finally(() => clearTimeout(t))

    if (!r.ok) {
      const text = await r.text().catch(() => "")
      return res.status(r.status).json({ error: text || "Error en OpenAI" })
    }

    const j = await r.json()
    const answer = j?.choices?.[0]?.message?.content ?? "Sin respuesta."
    res.json({ answer })
  } catch (e: any) {
    // Si abortó por timeout, e.name === 'AbortError'
    res.status(500).json({ error: e?.message ?? "Error" })
  }
})

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`)
  console.log("Allowed origins:", ALLOWED_ORIGINS.join(", "))
})
