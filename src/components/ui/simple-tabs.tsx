"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SimpleTabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
}

const SimpleTabs = React.forwardRef<HTMLDivElement, SimpleTabsProps>(
  ({ className, defaultValue, value, onValueChange, ...props }, ref) => {
    const [activeTab, setActiveTab] = React.useState(defaultValue || "")

    const handleTabChange = (newValue: string) => {
      setActiveTab(newValue)
      onValueChange?.(newValue)
    }

    return (
      <div
        ref={ref}
        className={cn("", className)}
        data-value={value || activeTab}
        {...props}
      />
    )
  }
)
SimpleTabs.displayName = "SimpleTabs"

interface SimpleTabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

const SimpleTabsList = React.forwardRef<HTMLDivElement, SimpleTabsListProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
          className
        )}
        {...props}
      />
    )
  }
)
SimpleTabsList.displayName = "SimpleTabsList"

interface SimpleTabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

const SimpleTabsTrigger = React.forwardRef<HTMLButtonElement, SimpleTabsTriggerProps>(
  ({ className, value, ...props }, ref) => {
    const context = React.useContext(SimpleTabsContext)
    const isActive = context?.value === value

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
          isActive && "bg-background text-foreground shadow-sm",
          className
        )}
        onClick={() => context?.onValueChange?.(value)}
        data-state={isActive ? "active" : "inactive"}
        {...props}
      />
    )
  }
)
SimpleTabsTrigger.displayName = "SimpleTabsTrigger"

interface SimpleTabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

const SimpleTabsContent = React.forwardRef<HTMLDivElement, SimpleTabsContentProps>(
  ({ className, value, ...props }, ref) => {
    const context = React.useContext(SimpleTabsContext)
    const isActive = context?.value === value

    if (!isActive) return null

    return (
      <div
        ref={ref}
        className={cn(
          "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          className
        )}
        data-state={isActive ? "active" : "inactive"}
        {...props}
      />
    )
  }
)
SimpleTabsContent.displayName = "SimpleTabsContent"

// Context for SimpleTabs
interface SimpleTabsContextValue {
  value: string
  onValueChange: (value: string) => void
}

const SimpleTabsContext = React.createContext<SimpleTabsContextValue | undefined>(undefined)

// Wrap SimpleTabs to provide context
const SimpleTabsWithContext = React.forwardRef<HTMLDivElement, SimpleTabsProps>(
  ({ defaultValue, value, onValueChange, ...props }, ref) => {
    const [activeTab, setActiveTab] = React.useState(defaultValue || "")

    const handleTabChange = (newValue: string) => {
      setActiveTab(newValue)
      onValueChange?.(newValue)
    }

    return (
      <SimpleTabsContext.Provider
        value={{
          value: value || activeTab,
          onValueChange: handleTabChange,
        }}
      >
        <SimpleTabs ref={ref} {...props} />
      </SimpleTabsContext.Provider>
    )
  }
)
SimpleTabsWithContext.displayName = "SimpleTabsWithContext"

export {
  SimpleTabsWithContext as SimpleTabs,
  SimpleTabsList,
  SimpleTabsTrigger,
  SimpleTabsContent,
} 