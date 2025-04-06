"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SimpleLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
}

const SimpleLabel = React.forwardRef<HTMLLabelElement, SimpleLabelProps>(
  ({ className, children, required, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "block text-sm font-medium text-gray-700 dark:text-gray-300",
          className
        )}
        {...props}
      >
        {children}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    )
  }
)
SimpleLabel.displayName = "SimpleLabel"

export { SimpleLabel } 