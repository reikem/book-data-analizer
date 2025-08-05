import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Send, MessageSquare, AlertCircle, Bot, User, Loader2, PlugZap } from "lucide-react"
import { useDataStore } from "@/lib/store"
import { askChatGPT, pingChat, makeLocalSummary } from "@/lib/chatUtils"

type Via = "remote" | "local"
type AskResult = { answer: string; via: Via }

interface ChatMessage {
  id: string
  question: string
  answer: string
  timestamp: Date
  isLoading?: boolean
  via?: Via
}

export function ChatInterface() {
  const { data, selectedCompanies, chatQuestions, incrementChatQuestions } = useDataStore()
  const [question, setQuestion] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [remoteAvailable, setRemoteAvailable] = useState<boolean | null>(null)

  // Ver disponibilidad del backend/ChatGPT una sola vez
  useEffect(() => {
    let mounted = true
    pingChat()
      .then((ok) => mounted && setRemoteAvailable(ok))
      .catch(() => setRemoteAvailable(false))
    return () => {
      mounted = false
    }
  }, [])

  // Filtro compatible con "SociedadNombre - SociedadCodigo"
  const filteredData = useMemo(() => {
    if (!data?.length) return []
    if (!selectedCompanies?.length) return data
    return data.filter((row) => {
      const display = `${row.SociedadNombre ?? ""} - ${row.SociedadCodigo ?? ""}`.trim()
      return (
        (display && selectedCompanies.includes(display)) ||
        (row.SociedadCodigo && selectedCompanies.includes(String(row.SociedadCodigo))) ||
        (row.SociedadNombre && selectedCompanies.includes(String(row.SociedadNombre)))
      )
    })
  }, [data, selectedCompanies])

  // Normalizamos la respuesta para que SIEMPRE sea {answer, via:"remote"}
  const chatMutation = useMutation<AskResult, Error, string>({
    mutationFn: async (q: string): Promise<AskResult> => {
      const res = await askChatGPT(q, filteredData)
      // Si askChatGPT devuelve string, lo envolvemos
      if (typeof res === "string") {
        return { answer: res, via: "remote" }
      }
      // Si ya devuelve {answer,...}, lo respetamos
      if (res && typeof (res as any).answer === "string") {
        return res as AskResult
      }
      // Fallback por seguridad
      return { answer: String(res ?? ""), via: "remote" }
    },
    onSuccess: (result) => {
      const { answer, via } = result
      setMessages((prev) => prev.map((m) => (m.isLoading ? { ...m, answer, via, isLoading: false } : m)))
      incrementChatQuestions()
    },
    onError: () => {
      // Si falla remoto, hacemos resumen local
      setMessages((prev) =>
        prev.map((m) =>
          m.isLoading
            ? {
                ...m,
                answer: makeLocalSummary(m.question, filteredData),
                via: "local",
                isLoading: false,
              }
            : m,
        ),
      )
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = question.trim()
    if (!q || chatQuestions >= 3 || chatMutation.isPending) return

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      question: q,
      answer: "",
      timestamp: new Date(),
      isLoading: true,
    }
    setMessages((prev) => [...prev, newMessage])
    setQuestion("")

    if (remoteAvailable) {
      chatMutation.mutate(q) // intenta remoto
    } else {
      // directo a local (sin mostrar error de conexión)
      const ans = makeLocalSummary(q, filteredData)
      setMessages((prev) =>
        prev.map((m) => (m.id === newMessage.id ? { ...m, answer: ans, via: "local", isLoading: false } : m)),
      )
      incrementChatQuestions()
    }
  }

  if (!data.length) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/20 dark:to-rose-900/20 flex items-center justify-center mb-4">
          <MessageSquare className="h-8 w-8 text-pink-500" />
        </div>
        <h3 className="text-lg font-semibold text-muted-foreground mb-2">Asistente IA no disponible</h3>
        <p className="text-muted-foreground">Carga algunos datos primero para hacer preguntas inteligentes.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
            Asistente IA
          </h1>
          <p className="text-muted-foreground">
            {remoteAvailable === false
              ? "Modo local (resumen sobre tus datos)"
              : "Haz preguntas inteligentes sobre tus datos"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {remoteAvailable === false && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <PlugZap className="h-3 w-3" /> Modo local
            </Badge>
          )}
          <Badge variant="outline">{Math.max(0, 3 - chatQuestions)} preguntas restantes</Badge>
        </div>
      </div>

      {/* Aviso */}
      <Alert className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-border">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-700 dark:text-blue-300">
          {remoteAvailable === false
            ? "Respondemos con un resumen automático local. Cuando el servicio esté disponible, se usará ChatGPT."
            : "Puedes hacer hasta 3 preguntas sobre tus datos. Si ChatGPT no está disponible, usaremos un resumen local."}
          {selectedCompanies.length > 0 && (
            <span className="ml-2">
              Filtrando por: <strong>{selectedCompanies.join(", ")}</strong>
            </span>
          )}
        </AlertDescription>
      </Alert>

      {/* Mensajes */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {messages.map((message) => (
          <div key={message.id} className="space-y-3">
            {/* Pregunta */}
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <User className="h-4 w-4" /> Tu pregunta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-800 dark:text-blue-200">{message.question}</p>
              </CardContent>
            </Card>

            {/* Respuesta */}
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-green-700 dark:text-green-300">
                  <Bot className="h-4 w-4" /> Respuesta{" "}
                  {message.via ? `(${message.via === "remote" ? "ChatGPT" : "local"})` : ""}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {message.isLoading ? (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Analizando tus datos...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-sm whitespace-pre-wrap text-green-800 dark:text-green-200">{message.answer}</p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-2">{message.timestamp.toLocaleString()}</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Input */}
      <Card className="bg-card/80 backdrop-blur-sm border-border/50">
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Haz una pregunta sobre tus datos..."
              disabled={chatQuestions >= 3 || chatMutation.isPending}
              className="flex-1 bg-background/60"
            />
            <Button
              type="submit"
              disabled={!question.trim() || chatQuestions >= 3 || chatMutation.isPending}
              className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
            >
              {chatMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}