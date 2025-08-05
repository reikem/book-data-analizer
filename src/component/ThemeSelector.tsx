import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sun, Moon, Monitor, Palette } from "lucide-react"
import { useTheme, useIsMounted } from "@/lib/ThemeProvider"

export function ThemeSelector() {
  const { theme, setTheme } = useTheme()
  const mounted = useIsMounted()

  const themes = [
    { id: "light",   name: "Modo Claro",   icon: Sun },
    { id: "dark",    name: "Modo Oscuro",  icon: Moon },
    { id: "system",  name: "Sistema",      icon: Monitor },
    { id: "dracula", name: "Dracula",      icon: Palette },
  ] as const

  const current = themes.find((t) => t.id === theme) ?? themes[0]
  const CurrentIcon = current.icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
          <CurrentIcon className="h-4 w-4 mr-2" />
          {mounted ? current.name : "Tema"}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        {themes.map((option) => {
          const Icon = option.icon
          // Marcamos seleccionado por comparativa con `theme`,
          // y para "system" mostramos ✓ si `resolved` coincide con el modo actual del SO.
          const isActive = theme === option.id || (option.id === "system" && theme === "system")
          return (
            <DropdownMenuItem
              key={option.id}
              onClick={() => setTheme(option.id)}
              className="cursor-pointer"
            >
              <Icon className="h-4 w-4 mr-2" />
              <span className="mr-2">{option.name}</span>
              {isActive ? <span className="ml-auto">✓</span> : null}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
