import { ThemeProvider, useTheme } from "@/lib/ThemeProvider"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { Toaster } from "sonner"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000 },
  },
})
function ThemedToaster() {
  const { resolved } = useTheme()
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      theme={resolved === "dark" ? "dark" : "light"} // dracula usa paleta oscura
    />
  )
}
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system">
        {children}
        <ThemedToaster />
        <Toaster position="top-right" richColors closeButton />
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
