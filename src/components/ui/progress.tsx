import * as React from "react"
import { cn } from "@/lib/utils"

type ProgressContextType = { value: number | null }
const ProgressContext = React.createContext<ProgressContextType>({ value: null })

function Progress({
  className,
  value,
  children,
  ...props
}: React.ComponentProps<"div"> & { value?: number | null }) {
  return (
    <ProgressContext.Provider value={{ value: value ?? null }}>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value ?? undefined}
        className={cn("flex flex-wrap gap-3", className)}
        {...props}
      >
        {children}
        <ProgressTrack>
          <ProgressIndicator />
        </ProgressTrack>
      </div>
    </ProgressContext.Provider>
  )
}

function ProgressTrack({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "relative flex h-1 w-full items-center overflow-hidden rounded-full bg-muted",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function ProgressIndicator({ className, ...props }: React.ComponentProps<"div">) {
  const { value } = React.useContext(ProgressContext)
  return (
    <div
      className={cn("h-full bg-primary transition-all", className)}
      style={{ width: `${value ?? 0}%` }}
      {...props}
    />
  )
}

function ProgressLabel({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span className={cn("text-sm font-medium", className)} {...props} />
  )
}

function ProgressValue({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn("ml-auto text-sm text-muted-foreground tabular-nums", className)}
      {...props}
    />
  )
}

export {
  Progress,
  ProgressTrack,
  ProgressIndicator,
  ProgressLabel,
  ProgressValue,
}
