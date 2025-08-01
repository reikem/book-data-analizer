import * as React from "react"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000 // ms

type ToastVariant = "default" | "destructive"

export type ToasterToast = {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactElement
  variant?: ToastVariant
  /** control interno para cerrar/abrir */
  open?: boolean
  /** se invoca cuando el componente UI cierra el toast */
  onOpenChange?: (open: boolean) => void
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

type ActionType = typeof actionTypes

type Action =
  | { type: ActionType["ADD_TOAST"]; toast: ToasterToast }
  | { type: ActionType["UPDATE_TOAST"]; toast: Partial<ToasterToast> & { id: string } }
  | { type: ActionType["DISMISS_TOAST"]; toastId?: ToasterToast["id"] }
  | { type: ActionType["REMOVE_TOAST"]; toastId?: ToasterToast["id"] }

interface State {
  toasts: ToasterToast[]
}

let count = 0
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

function clearFromQueue(id: string) {
  const t = toastTimeouts.get(id)
  if (t) {
    clearTimeout(t)
    toastTimeouts.delete(id)
  }
}

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) return
  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({ type: "REMOVE_TOAST", toastId })
  }, TOAST_REMOVE_DELAY)
  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST": {
      const next = [action.toast, ...state.toasts]
      return { ...state, toasts: next.slice(0, TOAST_LIMIT) }
    }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) => (t.id === action.toast.id ? { ...t, ...action.toast } : t)),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((t) => addToRemoveQueue(t.id))
      }
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined ? { ...t, open: false } : t,
        ),
      }
    }

    case "REMOVE_TOAST": {
      if (action.toastId === undefined) {
        // limpiar todos y timeouts
        state.toasts.forEach((t) => clearFromQueue(t.id))
        return { ...state, toasts: [] }
      }
      clearFromQueue(action.toastId)
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.toastId) }
    }
  }
}

const listeners: Array<(state: State) => void> = []
let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => listener(memoryState))
}

type ToastInput = Omit<ToasterToast, "id" | "open" | "onOpenChange">

function toast(props: ToastInput) {
  const id = genId()

  const update = (patch: Partial<ToasterToast>) =>
    dispatch({ type: "UPDATE_TOAST", toast: { ...patch, id } })

  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return { id, dismiss, update }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    // Suscribirse una sola vez
    const listener = (s: State) => setState(s)
    listeners.push(listener)
    return () => {
      const idx = listeners.indexOf(listener)
      if (idx > -1) listeners.splice(idx, 1)
    }
  }, []) // <- sin dependencia de `state`

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }
