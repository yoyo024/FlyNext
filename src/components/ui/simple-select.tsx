"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SimpleSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
}

const SimpleSelect = React.forwardRef<HTMLSelectElement, SimpleSelectProps>(
  ({ className, label, error, helperText, children, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            "w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            error && "border-red-500 focus:ring-red-500",
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        {helperText && !error && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>}
      </div>
    )
  }
)
SimpleSelect.displayName = "SimpleSelect"

interface SimpleSelectItemProps extends React.OptionHTMLAttributes<HTMLOptionElement> {
  value: string
  children: React.ReactNode
}

const SimpleSelectItem = React.forwardRef<HTMLOptionElement, SimpleSelectItemProps>(
  ({ className, value, children, ...props }, ref) => {
    return (
      <option
        ref={ref}
        value={value}
        className={cn("", className)}
        {...props}
      >
        {children}
      </option>
    )
  }
)
SimpleSelectItem.displayName = "SimpleSelectItem"

export { SimpleSelect, SimpleSelectItem } 