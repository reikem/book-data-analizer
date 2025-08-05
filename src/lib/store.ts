import { create } from "zustand"
import { persist } from "zustand/middleware"
import type {
  ProcessedDataRow,
  SociedadMapping,
  ChartConfig,
  CustomWidget,
} from "./types/type"

interface DataStore {
  data: ProcessedDataRow[]
  companies: string[]

  selectedCompany: string | null
  selectedCompanies: string[]

  sociedadMappings: SociedadMapping[]

  dashboardTitle: string
  dashboardDescription: string

  customWidgets: CustomWidget[]
  charts: ChartConfig[]

  chatQuestions: number

  // actions
  setData: (data: ProcessedDataRow[]) => void
  setCompanies: (companies: string[]) => void

  setSelectedCompany: (company: string | null) => void
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
    (set) => ({
      data: [],
      companies: [],

      selectedCompany: null,
      selectedCompanies: [],

      sociedadMappings: [],

      dashboardTitle: "Dashboard Analítico",
      dashboardDescription: "Métricas clave y visualizaciones de tus datos",

      customWidgets: [],
      charts: [],

      chatQuestions: 0,

      setData: (data) => set({ data }),
      setCompanies: (companies) => set({ companies }),

      setSelectedCompany: (company) => set({ selectedCompany: company }),
      setSelectedCompanies: (companies) => set({ selectedCompanies: companies }),

      setSociedadMappings: (mappings) => set({ sociedadMappings: mappings }),

      updateDashboardInfo: (title, description) =>
        set({ dashboardTitle: title, dashboardDescription: description }),

      addCustomWidget: (widget) =>
        set((state) => ({ customWidgets: [...state.customWidgets, widget] })),

      removeCustomWidget: (id) =>
        set((state) => ({
          customWidgets: state.customWidgets.filter((w) => w.id !== id),
        })),

      addChart: (chart) =>
        set((state) => ({ charts: [...state.charts, chart] })),

      incrementChatQuestions: () =>
        set((state) => ({ chatQuestions: state.chatQuestions + 1 })),
      resetChatQuestions: () => set({ chatQuestions: 0 }),
    }),
    {
      name: "data-analytics-storage",
      // Qué se persiste entre sesiones
      partialize: (state) => ({
        selectedCompany: state.selectedCompany,
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
