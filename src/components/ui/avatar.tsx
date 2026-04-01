"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type AvatarContextType = {
  imgLoaded: boolean
  setImgLoaded: (v: boolean) => void
  imgError: boolean
  setImgError: (v: boolean) => void
}

const AvatarContext = React.createContext<AvatarContextType>({
  imgLoaded: false,
  setImgLoaded: () => {},
  imgError: false,
  setImgError: () => {},
})

function Avatar({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<"span"> & {
  size?: "default" | "sm" | "lg"
}) {
  const [imgLoaded, setImgLoaded] = React.useState(false)
  const [imgError, setImgError] = React.useState(false)

  return (
    <AvatarContext.Provider value={{ imgLoaded, setImgLoaded, imgError, setImgError }}>
      <span
        className={cn(
          "relative flex shrink-0 overflow-hidden rounded-full",
          size === "default" && "size-8",
          size === "sm" && "size-6",
          size === "lg" && "size-10",
          className
        )}
        {...props}
      >
        {children}
      </span>
    </AvatarContext.Provider>
  )
}

function AvatarImage({
  className,
  src,
  alt = "",
  onLoad,
  onError,
  ...props
}: React.ComponentProps<"img">) {
  const { setImgLoaded, setImgError } = React.useContext(AvatarContext)

  if (!src) return null

  return (
    <img
      src={src}
      alt={alt}
      onLoad={(e) => {
        setImgLoaded(true)
        onLoad?.(e)
      }}
      onError={(e) => {
        setImgError(true)
        onError?.(e)
      }}
      className={cn("aspect-square size-full object-cover", className)}
      {...props}
    />
  )
}

function AvatarFallback({ className, ...props }: React.ComponentProps<"span">) {
  const { imgLoaded, imgError } = React.useContext(AvatarContext)

  if (imgLoaded && !imgError) return null

  return (
    <span
      className={cn(
        "flex size-full items-center justify-center rounded-full bg-muted text-sm text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function AvatarBadge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-background size-2.5",
        className
      )}
      {...props}
    />
  )
}

function AvatarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex -space-x-2", className)}
      {...props}
    />
  )
}

function AvatarGroupCount({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "relative flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm text-muted-foreground ring-2 ring-background",
        className
      )}
      {...props}
    />
  )
}

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarBadge,
}
