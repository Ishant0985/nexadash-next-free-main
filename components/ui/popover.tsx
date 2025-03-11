'use client'

import * as React from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { cn } from '@/lib/utils'

const Popover = PopoverPrimitive.Root

// Remove explicit ref types – ref is now a normal prop
type PopoverTriggerProps = React.ComponentPropsWithoutRef<
  typeof PopoverPrimitive.Trigger
> & {
  asChild?: boolean
}

function PopoverTrigger({
  asChild = false,
  children,
  ...props
}: PopoverTriggerProps) {
  return (
    <PopoverPrimitive.Trigger asChild {...props}>
      {asChild ? (
        children
      ) : (
        <div className="inline-block">{children}</div>
      )}
    </PopoverPrimitive.Trigger>
  )
}
PopoverTrigger.displayName = PopoverPrimitive.Trigger.displayName

type PopoverContentProps = React.ComponentPropsWithoutRef<
  typeof PopoverPrimitive.Content
>

function PopoverContent({
  className,
  align = 'center',
  sideOffset = 6,
  ...props
}: PopoverContentProps) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'text-popover-foreground z-50 w-[250px] rounded-lg bg-white p-4 text-left font-medium shadow-3xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent }
