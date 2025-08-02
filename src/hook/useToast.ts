import { toast as sonnerToast } from "sonner"
import * as React from "react"

const TOAST_LIMIT = 1 // Si quieres limitar visibles a 1
const TOAST_REMOVE_DELAY = 8_000 // ms (controla duración aprox.)

export type ToastVariant = "default" | "destructive" | "success" | "warning" | "info"

export type ToasterToast = {
  id?: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactElement
  variant?: ToastVariant
}

type ToastInput = Omit<ToasterToast, "id">

/** Mapea tus variants a Sonner */
function showWithVariant({ title, description, action, variant }: ToastInput) {
  const content = typeof title === "string" ? title : "Notificación"
  const common = { description, duration: TOAST_REMOVE_DELAY, action } as const

  switch (variant) {
    case "destructive":
      return sonnerToast.error(content, common)
    case "success":
      return sonnerToast.success(content, common)
    case "warning":
      return sonnerToast.warning(content, common)
    case "info":
      return sonnerToast.info(content, common)
    default:
      return sonnerToast(content, common)
  }
}

function toast(props: ToastInput) {
  // Limitar a 1 visible (opcional)
  if (TOAST_LIMIT === 1) {
    sonnerToast.dismiss() // cierra todos antes de abrir uno nuevo
  }
  const id = showWithVariant(props)
  return {
    id,
    dismiss: () => sonnerToast.dismiss(id),
    update: (patch: Partial<ToasterToast>) => {
      // Sonner no tiene "update" directo, re-emite:
      sonnerToast.dismiss(id)
      showWithVariant({ ...props, ...patch })
    },
  }
}

function useToast() {
  // Sonner gestiona estado internamente;
  // exponemos API compatible con tu app
  return {
    toasts: [], // ya no hace falta renderizar lista manual
    toast,
    dismiss: (toastId?: string) => sonnerToast.dismiss(toastId),
  }
}

export { useToast, toast }