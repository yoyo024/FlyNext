"use client"

import * as React from "react"
import { SimpleToast } from "./simple-toast"

interface ToastProps {
  id: string
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

export function useSimpleToast() {
  const [toasts, setToasts] = React.useState<ToastProps[]>([])

  const toast = React.useCallback(
    ({ title, description, variant = "default" }: ToastProps) => {
      const id = Math.random().toString(36).substring(2, 9)
      setToasts((prev) => [...prev, { id, title, description, variant }])

      // Auto-remove toast after 5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 5000)
    },
    []
  )

  const Toaster = React.useCallback(() => {
    return (
      <div className="fixed bottom-0 right-0 z-50 flex flex-col gap-2 p-4">
        {toasts.map(({ id, title, description, variant }) => (
          <SimpleToast
            key={id}
            title={title}
            description={description}
            variant={variant}
            open={true}
            onOpenChange={() => {
              setToasts((prev) => prev.filter((t) => t.id !== id))
            }}
          />
        ))}
      </div>
    )
  }, [toasts])

  return { toast, Toaster }
} 
