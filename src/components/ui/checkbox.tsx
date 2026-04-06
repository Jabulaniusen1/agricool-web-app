"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { CheckIcon } from "lucide-react"

function Checkbox({
  className,
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  ...props
}: Omit<React.ComponentProps<"button">, "checked" | "onChange"> & {
  checked?: boolean | "indeterminate"
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
}) {
  const [internal, setInternal] = React.useState(defaultChecked ?? false)
  const isChecked = checked !== undefined ? checked === true : internal

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={isChecked}
      disabled={disabled}
      onClick={() => {
        const next = !isChecked
        if (checked === undefined) setInternal(next)
        onCheckedChange?.(next)
      }}
      className={cn(
        "peer relative flex size-4 shrink-0 items-center justify-center rounded border-2 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-gray-300 disabled:cursor-not-allowed disabled:opacity-50",
        isChecked ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 bg-white",
        className
      )}
      {...props}
    >
      {isChecked && <CheckIcon className="size-3" />}
    </button>
  )
}

export { Checkbox }
