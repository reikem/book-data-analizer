import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { ProcessedDataRow, SociedadMapping, ChartConfig, CustomWidget } from "./types/type"

interface DataStore {

  data: ProcessedDataRow[]
  companies: string[]
  selectedCompanies: string[]
  sociedadMappings: SociedadMapping[]

  dashboardTitle: string
  dashboardDescription: string
  customWidgets: CustomWidget[]


  charts: ChartConfig[]

  chatQuestions: number

  setData: (data: ProcessedDataRow[]) => void
  setCompanies: (companies: string[]) => void
  setSelectedCompanies: (companies: string[]) => void
  setSociedadMappings: (mappings: SociedadMapping[]) => void
  updateDashboardInfo: (title: string, description: string) => void
  addCustomWidget: (widget: CustomWidget) => void
  removeCustomWidget: (id: string) => void
  addChart: (chart: ChartConfig) => void
  incrementChatQuestions: () => void
  resetChatQuestions: () => void
}

export const useDataStore = create<DataStore>()(
  persist(
    (set, get) => ({
      // Initial state
      data: [],
      companies: [],
      selectedCompanies: [],
      sociedadMappings: [],
      dashboardTitle: "Dashboard Analítico",
      dashboardDescription: "Métricas clave y visualizaciones de tus datos",
      customWidgets: [],
      charts: [],
      chatQuestions: 0,

      // Actions
      setData: (data) => set({ data }),
      setCompanies: (companies) => set({ companies }),
      setSelectedCompanies: (companies) => set({ selectedCompanies: companies }),
      setSociedadMappings: (mappings) => set({ sociedadMappings: mappings }),
      updateDashboardInfo: (title, description) => set({ dashboardTitle: title, dashboardDescription: description }),
      addCustomWidget: (widget) => set((state) => ({ customWidgets: [...state.customWidgets, widget] })),
      removeCustomWidget: (id) => set((state) => ({ customWidgets: state.customWidgets.filter((w) => w.id !== id) })),
      addChart: (chart) => set((state) => ({ charts: [...state.charts, chart] })),
      incrementChatQuestions: () => set((state) => ({ chatQuestions: state.chatQuestions + 1 })),
      resetChatQuestions: () => set({ chatQuestions: 0 }),
    }),
    {
      name: "data-analytics-storage",
      partialize: (state) => ({
        selectedCompanies: state.selectedCompanies,
        dashboardTitle: state.dashboardTitle,
        dashboardDescription: state.dashboardDescription,
        customWidgets: state.customWidgets,
        charts: state.charts,
        chatQuestions: state.chatQuestions,
      }),
    },
  ),
)
