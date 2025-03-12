'use client'

import React from 'react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { cn } from '@/lib/utils'
import { Check, Circle } from 'lucide-react'

// These primitives are re-exported directly.
const DropdownMenu = DropdownMenuPrimitive.Root
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger
const DropdownMenuGroup = DropdownMenuPrimitive.Group
const DropdownMenuPortal = DropdownMenuPrimitive.Portal
const DropdownMenuSub = DropdownMenuPrimitive.Sub
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

// ---------- DropdownMenuSubTrigger ----------
type DropdownMenuSubTriggerProps = React.ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.SubTrigger
> & { inset?: boolean; ref?: React.Ref<React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>> }

const DropdownMenuSubTrigger: React.FC<DropdownMenuSubTriggerProps> = ({
  className,
  inset,
  children,
  ...props
}) => {
  // Any passed ref is automatically included via the spread {...props} (React 19 treats ref as a normal prop)
  return (
    <DropdownMenuPrimitive.SubTrigger
      {...props}
      className={cn(
        'focus:bg-accent data-[state=open]:bg-accent flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm !outline-none [&[data-state=open]>svg]:!rotate-180',
        inset && 'pl-8',
        className
      )}
    >
      {children}
    </DropdownMenuPrimitive.SubTrigger>
  )
}
DropdownMenuSubTrigger.displayName = 'DropdownMenuSubTrigger'

// ---------- DropdownMenuSubContent ----------
type DropdownMenuSubContentProps = React.ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.SubContent
> & { ref?: React.Ref<React.ElementRef<typeof DropdownMenuPrimitive.SubContent>> }

const DropdownMenuSubContent: React.FC<DropdownMenuSubContentProps> = ({
  className,
  ...props
}) => {
  return (
    <DropdownMenuPrimitive.SubContent
      {...props}
      className={cn(
        'bg-popover text-popover-foreground z-50 min-w-[8rem] overflow-hidden rounded-md border p-1 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        className
      )}
    />
  )
}
DropdownMenuSubContent.displayName = 'DropdownMenuSubContent'

// ---------- DropdownMenuContent ----------
type DropdownMenuContentProps = React.ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.Content
> & { sideOffset?: number; ref?: React.Ref<React.ElementRef<typeof DropdownMenuPrimitive.Content>> }

const DropdownMenuContent: React.FC<DropdownMenuContentProps> = ({
  className,
  sideOffset = 6,
  ...props
}) => {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        {...props}
        sideOffset={sideOffset}
        className={cn(
          'z-50 min-w-[300px] space-y-1.5 overflow-y-auto rounded-b-lg bg-white p-1.5 text-gray-700 shadow-3xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          className
        )}
      />
    </DropdownMenuPrimitive.Portal>
  )
}
DropdownMenuContent.displayName = 'DropdownMenuContent'

// ---------- DropdownMenuItem ----------
type DropdownMenuItemProps = React.ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.Item
> & { inset?: boolean; ref?: React.Ref<React.ElementRef<typeof DropdownMenuPrimitive.Item>> }

const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({
  className,
  inset,
  ...props
}) => {
  return (
    <DropdownMenuPrimitive.Item
      {...props}
      className={cn(
        'focus:bg-accent focus:text-accent-foreground relative cursor-pointer select-none items-center rounded-lg px-3 py-2.5 text-sm/none font-medium outline-none transition-colors hover:bg-gray-400 hover:text-black data-[disabled]:opacity-50',
        inset && 'pl-8',
        className
      )}
    />
  )
}
DropdownMenuItem.displayName = 'DropdownMenuItem'

// ---------- DropdownMenuCheckboxItem ----------
type DropdownMenuCheckboxItemProps = React.ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.CheckboxItem
> & { ref?: React.Ref<React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>> }

const DropdownMenuCheckboxItem: React.FC<DropdownMenuCheckboxItemProps> = ({
  className,
  children,
  checked,
  ...props
}) => {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      {...props}
      checked={checked}
      className={cn(
        'focus:bg-accent focus:text-accent-foreground relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-xs/tight outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className
      )}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Check className="h-3 w-3" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  )
}
DropdownMenuCheckboxItem.displayName = 'DropdownMenuCheckboxItem'

// ---------- DropdownMenuRadioItem ----------
type DropdownMenuRadioItemProps = React.ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.RadioItem
> & { ref?: React.Ref<React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>> }

const DropdownMenuRadioItem: React.FC<DropdownMenuRadioItemProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <DropdownMenuPrimitive.RadioItem
      {...props}
      className={cn(
        'focus:bg-accent focus:text-accent-foreground relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className
      )}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Circle className="h-2 w-2 fill-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  )
}
DropdownMenuRadioItem.displayName = 'DropdownMenuRadioItem'

// ---------- DropdownMenuLabel ----------
type DropdownMenuLabelProps = React.ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.Label
> & { inset?: boolean; ref?: React.Ref<React.ElementRef<typeof DropdownMenuPrimitive.Label>> }

const DropdownMenuLabel: React.FC<DropdownMenuLabelProps> = ({
  className,
  inset,
  ...props
}) => {
  return (
    <DropdownMenuPrimitive.Label
      {...props}
      className={cn('px-2 py-1.5 text-sm font-semibold', inset && 'pl-8', className)}
    />
  )
}
DropdownMenuLabel.displayName = 'DropdownMenuLabel'

// ---------- DropdownMenuSeparator ----------
type DropdownMenuSeparatorProps = React.ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.Separator
> & { ref?: React.Ref<React.ElementRef<typeof DropdownMenuPrimitive.Separator>> }

const DropdownMenuSeparator: React.FC<DropdownMenuSeparatorProps> = ({
  className,
  ...props
}) => {
  return (
    <DropdownMenuPrimitive.Separator
      {...props}
      className={cn('mx-3 h-px bg-gray-300', className)}
    />
  )
}
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator'

// ---------- DropdownMenuShortcut ----------
type DropdownMenuShortcutProps = React.HTMLAttributes<HTMLSpanElement>

const DropdownMenuShortcut: React.FC<DropdownMenuShortcutProps> = ({
  className,
  ...props
}) => {
  return (
    <span
      {...props}
      className={cn('ml-auto text-xs tracking-widest opacity-60', className)}
    />
  )
}
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut'

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}
