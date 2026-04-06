"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

function TooltipProvider({ children, delay: _delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return <>{children}</>
}

function Tooltip({ children }: { children: React.ReactNode }) {
  return <div className="relative inline-flex group">{children}</div>
}

function TooltipTrigger({ children, ...props }: React.ComponentProps<"button">) {
  return (
    <button type="button" {...props}>
      {children}
    </button>
  )
}

function TooltipContent({
  className,
  side = "top",
  children,
  ...props
}: React.ComponentProps<"div"> & { side?: "top" | "bottom" | "left" | "right"; sideOffset?: number; align?: string; alignOffset?: number }) {
  const posClass =
    side === "top" ? "bottom-full mb-2 left-1/2 -translate-x-1/2"
    : side === "bottom" ? "top-full mt-2 left-1/2 -translate-x-1/2"
    : side === "left" ? "right-full mr-2 top-1/2 -translate-y-1/2"
    : "left-full ml-2 top-1/2 -translate-y-1/2"

  return (
    <div
      role="tooltip"
      className={cn(
        "absolute z-50 hidden w-max max-w-xs rounded-md bg-gray-900 px-2.5 py-1.5 text-xs text-white shadow-lg group-hover:block",
        posClass,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
