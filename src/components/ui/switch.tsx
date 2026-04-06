"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

function Switch({
  className,
  size = "default",
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  ...props
}: Omit<React.ComponentProps<"button">, "checked" | "defaultChecked" | "onChange"> & {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  size?: "sm" | "default"
}) {
  const [internal, setInternal] = React.useState(defaultChecked ?? false)
  const isChecked = checked !== undefined ? checked : internal

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isChecked}
      disabled={disabled}
      onClick={() => {
        const next = !isChecked
        if (checked === undefined) setInternal(next)
        onCheckedChange?.(next)
      }}
      className={cn(
        "peer relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors outline-none focus-visible:ring-2 focus-visible:ring-gray-300 disabled:cursor-not-allowed disabled:opacity-50",
        size === "default" ? "h-5 w-9" : "h-3.5 w-6",
        isChecked ? "bg-gray-900" : "bg-gray-300",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "pointer-events-none block rounded-full bg-white shadow transition-transform duration-200",
          size === "default" ? "size-4" : "size-3",
          isChecked
            ? size === "default" ? "translate-x-4" : "translate-x-2.5"
            : "translate-x-0"
        )}
      />
    </button>
  )
}

export { Switch }
