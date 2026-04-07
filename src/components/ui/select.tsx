"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDownIcon, CheckIcon } from "lucide-react"

type SelectContextType = {
  value: string
  onValueChange: (v: string) => void
  open: boolean
  setOpen: (v: boolean) => void
  labelMap: Record<string, string>
  registerLabel: (value: string, label: string) => void
}

const SelectContext = React.createContext<SelectContextType | null>(null)

function Select({
  value,
  defaultValue = "",
  onValueChange,
  disabled = false,
  children,
}: {
  value?: string
  defaultValue?: string
  onValueChange?: (v: string) => void
  disabled?: boolean
  children: React.ReactNode
}) {
  const [internal, setInternal] = React.useState(defaultValue)
  const [open, setOpen] = React.useState(false)
  const [labelMap, setLabelMap] = React.useState<Record<string, string>>({})
  const actual = value !== undefined ? value : internal

  const handleChange = (v: string) => {
    if (disabled) return
    if (value === undefined) setInternal(v)
    onValueChange?.(v)
    setOpen(false)
  }

  const registerLabel = React.useCallback((v: string, label: string) => {
    setLabelMap((prev) => (prev[v] === label ? prev : { ...prev, [v]: label }))
  }, [])

  const ref = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  return (
    <SelectContext.Provider value={{ value: actual, onValueChange: handleChange, open: disabled ? false : open, setOpen: disabled ? () => {} : setOpen, labelMap, registerLabel }}>
      <div ref={ref} className={cn("relative", disabled && "opacity-50 pointer-events-none")}>
        {children}
      </div>
    </SelectContext.Provider>
  )
}

function SelectTrigger({
  className,
  children,
  size = "default",
  ...props
}: React.ComponentProps<"button"> & { size?: "sm" | "default" }) {
  const ctx = React.useContext(SelectContext)
  return (
    <button
      type="button"
      onClick={() => ctx?.setOpen(!ctx.open)}
      aria-expanded={ctx?.open}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 transition-colors outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-200 disabled:cursor-not-allowed disabled:opacity-50",
        size === "default" ? "h-9" : "h-8",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDownIcon className="size-4 text-gray-400 shrink-0" />
    </button>
  )
}

function SelectValue({
  placeholder,
  className,
  ...props
}: React.ComponentProps<"span"> & { placeholder?: string }) {
  const ctx = React.useContext(SelectContext)
  const displayLabel = ctx?.value ? (ctx.labelMap[ctx.value] ?? ctx.value) : undefined
  return (
    <span
      className={cn("flex-1 text-left truncate", !ctx?.value && "text-gray-400", className)}
      {...props}
    >
      {displayLabel ?? placeholder}
    </span>
  )
}

function SelectContent({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const ctx = React.useContext(SelectContext)
  return (
    <div
      className={cn(
        "absolute left-0 top-full z-50 mt-1 w-full min-w-36 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg",
        !ctx?.open && "hidden",
        className
      )}
      {...props}
    >
      <div className="p-1">{children}</div>
    </div>
  )
}

function SelectGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("p-1", className)} {...props} />
}

function SelectLabel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("px-2 py-1 text-xs font-medium text-gray-400", className)} {...props} />
  )
}

function extractText(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(extractText).join("")
  if (React.isValidElement(node)) return extractText((node.props as { children?: React.ReactNode }).children)
  return ""
}

function SelectItem({
  className,
  children,
  value,
  disabled,
  ...props
}: React.ComponentProps<"div"> & { value: string; disabled?: boolean }) {
  const ctx = React.useContext(SelectContext)
  const isSelected = ctx?.value === value

  const label = extractText(children)
  React.useEffect(() => {
    if (label) ctx?.registerLabel(value, label)
  }, [value, label])

  return (
    <div
      role="option"
      aria-selected={isSelected}
      aria-disabled={disabled}
      onClick={() => !disabled && ctx?.onValueChange(value)}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-md py-1.5 pl-3 pr-8 text-sm text-gray-900 outline-none transition-colors",
        disabled ? "pointer-events-none opacity-50" : "hover:bg-gray-100 cursor-pointer",
        isSelected && "bg-gray-100 font-medium",
        className
      )}
      {...props}
    >
      <span className="flex-1 truncate">{children}</span>
      {isSelected && (
        <span className="absolute right-2 flex size-4 items-center justify-center">
          <CheckIcon className="size-3.5 text-gray-600" />
        </span>
      )}
    </div>
  )
}

function SelectSeparator({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("-mx-1 my-1 h-px bg-gray-200", className)} {...props} />
}

function SelectScrollUpButton(_props: React.ComponentProps<"div">) { return null }
function SelectScrollDownButton(_props: React.ComponentProps<"div">) { return null }

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
