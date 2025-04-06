"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SimpleToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive"
  title?: string
  description?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const SimpleToast = React.forwardRef<HTMLDivElement, SimpleToastProps>(
  ({ className, variant = "default", title, description, open = false, onOpenChange, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(open)

    React.useEffect(() => {
      setIsOpen(open)
    }, [open])

    const handleClose = () => {
      setIsOpen(false)
      onOpenChange?.(false)
    }

    if (!isOpen) return null

    return (
      <div
        ref={ref}
        className={cn(
          "fixed bottom-4 right-4 z-50 flex w-full max-w-md items-center space-x-4 rounded-lg border p-4 shadow-lg",
          variant === "destructive" ? "border-red-500 bg-red-50 text-red-900" : "border-gray-200 bg-white text-gray-900",
          className
        )}
        {...props}
      >
        <div className="flex-1">
          {title && <h3 className="font-semibold">{title}</h3>}
          {description && <p className="text-sm opacity-90">{description}</p>}
        </div>
        <button
          onClick={handleClose}
          className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
    )
  }
)
SimpleToast.displayName = "SimpleToast"

interface SimpleToastProviderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const SimpleToastProvider = React.forwardRef<HTMLDivElement, SimpleToastProviderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("fixed inset-0 z-50 flex items-end justify-end p-4", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
SimpleToastProvider.displayName = "SimpleToastProvider"

interface SimpleToastViewportProps extends React.HTMLAttributes<HTMLDivElement> {}

const SimpleToastViewport = React.forwardRef<HTMLDivElement, SimpleToastViewportProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col gap-2", className)}
        {...props}
      />
    )
  }
)
SimpleToastViewport.displayName = "SimpleToastViewport"

export {
  SimpleToast,
  SimpleToastProvider,
  SimpleToastViewport,
} 