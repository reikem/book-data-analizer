import type React from "react"
import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Send, MessageSquare, AlertCircle, Bot, User, Loader2 } from "lucide-react"
import { useDataStore } from "@/lib/store"
import { askChatGPT } from "@/lib/chatUtils"


interface ChatMessage {
  id: string
  question: string
  answer: string
  timestamp: Date
  isLoading?: boolean
}

export function ChatInterface() {
  const { data, selectedCompanies, chatQuestions, incrementChatQuestions } = useDataStore()
  const [question, setQuestion] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])

  const filteredData =
    selectedCompanies.length > 0
      ? data.filter((row) => {
          const company = row.Sociedad || row["Soc."] || row.codigo
          return selectedCompanies.includes(company?.toString())
        })
      : data

  const chatMutation = useMutation({
    mutationFn: (question: string) => askChatGPT(question, filteredData),
    onSuccess: (answer, question) => {
      setMessages((prev) => prev.map((msg) => (msg.isLoading ? { ...msg, answer, isLoading: false } : msg)))
      incrementChatQuestions()
    },
    onError: (error) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.isLoading
            ? {
                ...msg,
                answer: "Lo siento, hubo un error al procesar tu pregunta. Por favor intenta de nuevo.",
                isLoading: false,
              }
            : msg,
        ),
      )
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim() || chatQuestions >= 3 || chatMutation.isPending) return

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      question: question.trim(),
      answer: "",
      timestamp: new Date(),
      isLoading: true,
    }

    setMessages((prev) => [...prev, newMessage])
    setQuestion("")
    chatMutation.mutate(question.trim())
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/20 dark:to-rose-900/20 flex items-center justify-center mb-4">
          <MessageSquare className="h-8 w-8 text-pink-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">Asistente IA no disponible</h3>
        <p className="text-gray-500 dark:text-gray-500">
          Carga algunos datos primero para hacer preguntas inteligentes
        </p>
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
          <p className="text-gray-600 dark:text-gray-400">Haz preguntas inteligentes sobre tus datos</p>
        </div>
        <Badge
          variant="outline"
          className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20"
        >
          {3 - chatQuestions} preguntas restantes
        </Badge>
      </div>

      {/* Usage Alert */}
      <Alert className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-700 dark:text-blue-300">
          Puedes hacer hasta 3 preguntas sobre tus datos. Si ChatGPT no está disponible, usaremos análisis local
          inteligente.
          {selectedCompanies.length > 0 && (
            <span className="ml-2">
              Analizando datos de: <strong>{selectedCompanies.join(", ")}</strong>
            </span>
          )}
        </AlertDescription>
      </Alert>

      {/* Chat Messages */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {messages.map((message) => (
          <div key={message.id} className="space-y-3">
            {/* User Question */}
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center space-x-2 text-blue-700 dark:text-blue-300">
                  <User className="h-4 w-4" />
                  <span>Tu pregunta:</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-800 dark:text-blue-200">{message.question}</p>
              </CardContent>
            </Card>

            {/* AI Response */}
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center space-x-2 text-green-700 dark:text-green-300">
                  <Bot className="h-4 w-4" />
                  <span>Respuesta de ChatGPT:</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {message.isLoading ? (
                  <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Analizando tus datos...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-sm whitespace-pre-wrap text-green-800 dark:text-green-200">{message.answer}</p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                      {message.timestamp.toLocaleString()}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Question Input */}
      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-gray-200/50 dark:border-slate-700/50">
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Haz una pregunta sobre tus datos..."
              disabled={chatQuestions >= 3 || chatMutation.isPending}
              className="flex-1 bg-white/50 dark:bg-slate-800/50"
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

      {chatQuestions >= 3 && (
        <Alert className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800">
          <AlertDescription className="text-red-700 dark:text-red-300">
            Has alcanzado el límite de 3 preguntas. Recarga la página para reiniciar el contador.
          </AlertDescription>
        </Alert>
      )}

      {/* Data Summary */}
      <Card className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 border-gray-200 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p className="font-medium mb-2">Contexto de datos disponible:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="font-medium">Registros:</span> {filteredData.length.toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Sociedades:</span> {selectedCompanies.length || "Todas"}
              </div>
              <div>
                <span className="font-medium">Columnas:</span>{" "}
                {filteredData.length > 0 ? Object.keys(filteredData[0]).length : 0}
              </div>
              <div>
                <span className="font-medium">Fuentes:</span> {new Set(data.map((row) => row._source)).size}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
