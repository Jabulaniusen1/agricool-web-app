"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { XIcon } from "lucide-react"

type DrawerContextType = {
  open: boolean
  setOpen: (v: boolean) => void
  direction: "top" | "bottom" | "left" | "right"
}

const DrawerContext = React.createContext<DrawerContextType>({
  open: false,
  setOpen: () => {},
  direction: "bottom",
})

function Drawer({
  open,
  defaultOpen = false,
  onOpenChange,
  direction = "bottom",
  children,
}: {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  direction?: "top" | "bottom" | "left" | "right"
  children: React.ReactNode
}) {
  const [internal, setInternal] = React.useState(defaultOpen)
  const actual = open !== undefined ? open : internal

  const setOpen = (v: boolean) => {
    if (open === undefined) setInternal(v)
    onOpenChange?.(v)
  }

  return (
    <DrawerContext.Provider value={{ open: actual, setOpen, direction }}>
      {children}
    </DrawerContext.Provider>
  )
}

function DrawerTrigger({ children, ...props }: React.ComponentProps<"button">) {
  const { setOpen } = React.useContext(DrawerContext)
  return (
    <button type="button" onClick={() => setOpen(true)} {...props}>
      {children}
    </button>
  )
}

function DrawerClose({ children, ...props }: React.ComponentProps<"button">) {
  const { setOpen } = React.useContext(DrawerContext)
  return (
    <button type="button" onClick={() => setOpen(false)} {...props}>
      {children}
    </button>
  )
}

function DrawerPortal({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

function DrawerOverlay({ className, ...props }: React.ComponentProps<"div">) {
  const { setOpen } = React.useContext(DrawerContext)
  return (
    <div
      className={cn("fixed inset-0 z-50 bg-black/40 backdrop-blur-sm", className)}
      onClick={() => setOpen(false)}
      {...props}
    />
  )
}

const directionClasses = {
  bottom: "inset-x-0 bottom-0 h-auto max-h-[80vh] rounded-t-xl border-t mt-24",
  top: "inset-x-0 top-0 h-auto max-h-[80vh] rounded-b-xl border-b mb-24",
  left: "inset-y-0 left-0 h-full w-3/4 rounded-r-xl border-r sm:max-w-sm",
  right: "inset-y-0 right-0 h-full w-3/4 rounded-l-xl border-l sm:max-w-sm",
}

function DrawerContent({ className, children, ...props }: React.ComponentProps<"div">) {
  const { open, setOpen, direction } = React.useContext(DrawerContext)

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    if (open) document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, setOpen])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <DrawerOverlay />
      <div
        className={cn(
          "fixed z-50 flex flex-col bg-popover text-sm text-popover-foreground shadow-lg",
          directionClasses[direction],
          className
        )}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {(direction === "bottom" || direction === "top") && (
          <div className="mx-auto mt-4 h-1 w-24 shrink-0 rounded-full bg-muted" />
        )}
        {children}
      </div>
    </div>
  )
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-0.5 p-4", className)} {...props} />
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mt-auto flex flex-col gap-2 p-4", className)} {...props} />
}

function DrawerTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return <h2 className={cn("text-base font-semibold text-foreground", className)} {...props} />
}

function DrawerDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
