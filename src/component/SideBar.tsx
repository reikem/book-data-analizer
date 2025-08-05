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
  Database,
} from "lucide-react"
import { useDataStore } from "@/lib/store"
import { ThemeSelector } from "@/component/ThemeSelector"
import { CompanyMultiSelector } from "@/component/CompanyMultiSelector"

interface SidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

const menuItems = [
  { id: "examples", label: "Archivos de Ejemplo", icon: FileSpreadsheet, description: "Descargar ejemplos" },
  { id: "upload", label: "Cargar Datos", icon: Upload, description: "Subir archivos CSV" },
  { id: "dashboard", label: "Dashboard", icon: BarChart3, description: "Métricas y KPIs" },
  { id: "table", label: "Tabla de Datos", icon: Table, description: "Explorar datos" },
  { id: "charts", label: "Generar Gráficos", icon: PieChart, description: "Crear visualizaciones" },
  { id: "chat", label: "Asistente IA", icon: MessageSquare, description: "Preguntas inteligentes" },
  { id: "reports", label: "Generar Informes", icon: FileText, description: "PDF y PowerPoint" },
  { id: "help", label: "Ayuda", icon: HelpCircle, description: "Guía de uso" },
] as const

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { data, chatQuestions } = useDataStore()

  const toggleMobileMenu = () => setIsMobileMenuOpen((s) => !s)
  const handleSectionChange = (section: string) => {
    onSectionChange(section)
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      {/* Botón mobile */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleMobileMenu}
          className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-border/50"
        >
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Overlay mobile */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-64 bg-card/95 backdrop-blur-sm border-r border-border/50 shadow-xl z-40 transition-transform",
          "lg:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Database className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Analytics Pro</h1>
                <p className="text-xs text-muted-foreground">Plataforma de Análisis</p>
              </div>
            </div>
          </div>

          {/* Estado de datos */}
          {data.length > 0 && (
            <div className="p-4 border-b border-border/50">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">Datos cargados</span>
                </div>
                <p className="text-xs text-green-600 dark:text-green-400">
                  {data.length.toLocaleString()} registros disponibles
                </p>
              </div>
            </div>
          )}

          {/* Multi-selector de sociedades en el sidebar */}
          {data.length > 0 && (
            <div className="p-4 border-b border-border/50">
              <CompanyMultiSelector />
            </div>
          )}

          {/* Navegación */}
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
                    isActive ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-muted/80 text-foreground",
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
                        {item.id === "chat" && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                            {chatQuestions}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                    </div>
                  </div>
                </Button>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border/50 space-y-2">
            <ThemeSelector />
            {data.length > 0 && (
              <div className="text-xs text-muted-foreground text-center pt-1">
                {data.length.toLocaleString()} registros cargados
              </div>
            )}
            <p className="text-[10px] text-muted-foreground text-center">Analytics Pro v1.0</p>
          </div>
        </div>
      </aside>
    </>
  )
}
