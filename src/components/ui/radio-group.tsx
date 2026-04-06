"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type RadioGroupContextType = {
  value: string
  onValueChange: (v: string) => void
}

const RadioGroupContext = React.createContext<RadioGroupContextType | null>(null)

function RadioGroup({
  className,
  value,
  defaultValue = "",
  onValueChange,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}) {
  const [internal, setInternal] = React.useState(defaultValue)
  const actual = value !== undefined ? value : internal

  const handleChange = (v: string) => {
    if (value === undefined) setInternal(v)
    onValueChange?.(v)
  }

  return (
    <RadioGroupContext.Provider value={{ value: actual, onValueChange: handleChange }}>
      <div role="radiogroup" className={cn("grid w-full gap-2", className)} {...props}>
        {children}
      </div>
    </RadioGroupContext.Provider>
  )
}

function RadioGroupItem({
  className,
  value,
  disabled,
  ...props
}: Omit<React.ComponentProps<"button">, "value"> & { value: string }) {
  const ctx = React.useContext(RadioGroupContext)
  const isChecked = ctx?.value === value

  return (
    <button
      type="button"
      role="radio"
      aria-checked={isChecked}
      disabled={disabled}
      onClick={() => ctx?.onValueChange(value)}
      className={cn(
        "peer relative flex aspect-square size-4 shrink-0 rounded-full border-2 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-gray-300 disabled:cursor-not-allowed disabled:opacity-50",
        isChecked ? "border-gray-900 bg-gray-900" : "border-gray-300 bg-white",
        className
      )}
      {...props}
    >
      {isChecked && (
        <span className="absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
      )}
    </button>
  )
}

export { RadioGroup, RadioGroupItem }
