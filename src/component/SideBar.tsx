import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  BarChart3,
  Upload,
  Table,
  MessageSquare,
  FileText,
  HelpCircle,
  Menu,
  X,
  FileSpreadsheet,
  PieChart,
} from "lucide-react"
import { useDataStore } from "@/lib/store"

interface SidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

const menuItems = [
  {
    id: "examples",
    label: "Archivos de Ejemplo",
    icon: FileSpreadsheet,
    description: "Descargar ejemplos",
  },
  {
    id: "upload",
    label: "Cargar Datos",
    icon: Upload,
    description: "Subir archivos CSV",
  },
  {
    id: "dashboard",
    label: "Dashboard",
    icon: BarChart3,
    description: "Métricas y KPIs",
  },
  {
    id: "table",
    label: "Tabla de Datos",
    icon: Table,
    description: "Explorar datos",
  },
  {
    id: "charts",
    label: "Generar Gráficos",
    icon: PieChart,
    description: "Crear visualizaciones",
  },
  {
    id: "chat",
    label: "Asistente IA",
    icon: MessageSquare,
    description: "Preguntas inteligentes",
  },
  {
    id: "reports",
    label: "Generar Informes",
    icon: FileText,
    description: "PDF y PowerPoint",
  },
  {
    id: "help",
    label: "Ayuda",
    icon: HelpCircle,
    description: "Guía de uso",
  },
]

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { data, chatQuestions } = useDataStore()

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const handleSectionChange = (section: string) => {
    onSectionChange(section)
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleMobileMenu}
          className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-gray-200/50 dark:border-slate-700/50"
        >
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 h-full w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-r border-gray-200/50 dark:border-slate-700/50 shadow-xl z-40 transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200/50 dark:border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">Analytics Pro</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Plataforma de Análisis</p>
              </div>
            </div>
          </div>

          {/* Data Status */}
          {data.length > 0 && (
            <div className="p-4 border-b border-gray-200/50 dark:border-slate-700/50">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">Datos cargados</span>
                </div>
                <p className="text-xs text-green-600 dark:text-green-400">
                  {data.length.toLocaleString()} registros disponibles
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = activeSection === item.id
              const isDisabled =
                item.id !== "upload" && item.id !== "help" && item.id !== "examples" && data.length === 0

              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start h-auto p-3 text-left transition-all duration-200",
                    isActive && "bg-blue-500 text-white shadow-lg",
                    !isActive && "hover:bg-gray-100 dark:hover:bg-slate-800",
                    isDisabled && "opacity-50 cursor-not-allowed",
                  )}
                  onClick={() => !isDisabled && handleSectionChange(item.id)}
                  disabled={isDisabled}
                >
                  <div className="flex items-center gap-3 w-full">
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{item.label}</span>
                        {item.id === "chat" && chatQuestions > 0 && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                            {chatQuestions}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs opacity-75 truncate">{item.description}</p>
                    </div>
                  </div>
                </Button>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200/50 dark:border-slate-700/50">
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Analytics Pro v1.0</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Plataforma de análisis de datos</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
