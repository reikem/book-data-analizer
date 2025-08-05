import "dotenv/config"
import express from "express"
import cors from "cors"

const app = express()
const PORT = Number(process.env.PORT) || 8787

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean)

app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true) // SSR / curl / same-origin
    const ok = ALLOWED_ORIGINS.some(o => origin === o || origin.startsWith(o))
    return cb(ok ? null : new Error("Not allowed by CORS"), ok)
  },
  credentials: false,
}))
app.use(express.json())

app.get("/", (_req, res) => res.send("API OK"))

app.post("/ask", async (req, res) => {
  try {
    const { question, data, companies } = req.body || {}
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Falta OPENAI_API_KEY" })
    }

    const sample = Array.isArray(data) ? data.slice(0, 200) : []

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3,
        messages: [
          { role: "system", content: "Eres analista financiero. Responde claro y en español." },
          { role: "user", content:
            `Pregunta: ${question}\n` +
            `Sociedades: ${companies?.join(", ") ?? "todas"}\n` +
            `Muestra: ${JSON.stringify(sample)}`
          }
        ],
      }),
    })

    if (!r.ok) return res.status(r.status).json({ error: await r.text() })
    const j = await r.json()
    const answer = j?.choices?.[0]?.message?.content ?? "Sin respuesta."
    res.json({ answer })
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "Error" })
  }
})

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`)
  console.log("Allowed origins:", ALLOWED_ORIGINS.join(", "))
})
