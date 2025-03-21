'use client'

import React from 'react'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { cn } from '@/lib/utils'
import { ChevronDown, Minus, Plus } from 'lucide-react'

// Base Accordion remains unchanged.
const Accordion = AccordionPrimitive.Root

// ---------- AccordionItem ----------
type AccordionItemProps = React.ComponentPropsWithoutRef<
  typeof AccordionPrimitive.Item
> & {
  ref?: React.Ref<React.ElementRef<typeof AccordionPrimitive.Item>>
}

const AccordionItem: React.FC<AccordionItemProps> = ({ className, ...props }) => {
  return (
    <AccordionPrimitive.Item
      {...props}
      className={cn('rounded-lg shadow-3xl', className)}
    />
  )
}
AccordionItem.displayName = 'AccordionItem'

// ---------- AccordionTrigger ----------
type AccordionTriggerProps = React.ComponentPropsWithoutRef<
  typeof AccordionPrimitive.Trigger
> & {
  icons?: string
  iconsPosition?: 'left' | 'right'
  ref?: React.Ref<React.ElementRef<typeof AccordionPrimitive.Trigger>>
}

const AccordionTrigger: React.FC<AccordionTriggerProps> = ({
  className,
  icons,
  iconsPosition = 'right',
  children,
  ...props
}) => {
  return (
    <AccordionPrimitive.Header>
      <AccordionPrimitive.Trigger
        {...props}
        className={cn(
          'group flex w-full gap-2.5 px-4 py-3 text-left text-black outline-none hover:text-black data-[state=open]:text-black [&[data-state=open]>svg.arrow]:rotate-180 [&[data-state=open]>svg.arrow]:text-black [&[data-state=open]>svg.minus]:block [&[data-state=open]>svg.plus]:hidden',
          className,
          iconsPosition === 'right' ? 'justify-between xl:gap-5' : ''
        )}
      >
        {iconsPosition === 'left' &&
          (icons === 'plus-minus' ? (
            <>
              <Plus className="plus h-[18px] w-[18px] shrink-0 text-gray-600 transition-transform duration-200" />
              <Minus className="minus hidden h-[18px] w-[18px] shrink-0 transition-transform duration-200" />
            </>
          ) : (
            <ChevronDown className="arrow h-[18px] w-[18px] shrink-0 text-gray-600 transition-transform duration-200" />
          ))}
        {children}
        {iconsPosition === 'right' &&
          (icons === 'plus-minus' ? (
            <>
              <Plus className="plus ml-auto h-[18px] w-[18px] shrink-0 text-gray-600 transition-transform duration-200" />
              <Minus className="minus ml-auto hidden h-[18px] w-[18px] shrink-0 transition-transform duration-200" />
            </>
          ) : (
            <ChevronDown className="arrow ml-auto h-[18px] w-[18px] shrink-0 text-gray transition-transform duration-200 group-hover:text-black" />
          ))}
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

// ---------- AccordionContent ----------
type AccordionContentProps = React.ComponentPropsWithoutRef<
  typeof AccordionPrimitive.Content
> & {
  parentClassName?: string
  ref?: React.Ref<React.ElementRef<typeof AccordionPrimitive.Content>>
}

const AccordionContent: React.FC<AccordionContentProps> = ({
  className,
  children,
  parentClassName,
  ...props
}) => {
  return (
    <AccordionPrimitive.Content
      {...props}
      className={cn(
        'overflow-hidden text-left data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down data-[state=open]:transition-all data-[state=open]:duration-300',
        parentClassName
      )}
    >
      <div className={cn('', className)}>{children}</div>
    </AccordionPrimitive.Content>
  )
}
AccordionContent.displayName = AccordionPrimitive.Content.displayName

// ---------- AccordionItemTwo ----------
type AccordionItemTwoProps = React.ComponentPropsWithoutRef<
  typeof AccordionPrimitive.Item
> & {
  ref?: React.Ref<React.ElementRef<typeof AccordionPrimitive.Item>>
}

const AccordionItemTwo: React.FC<AccordionItemTwoProps> = ({
  className,
  ...props
}) => {
  return (
    <AccordionPrimitive.Item
      {...props}
      className={cn('rounded-lg shadow-3xl', className)}
    />
  )
}
AccordionItemTwo.displayName = 'AccordionItemTwo'

// ---------- AccordionTriggerTwo ----------
type AccordionTriggerTwoProps = React.ComponentPropsWithoutRef<
  typeof AccordionPrimitive.Trigger
> & {
  icons?: string
  iconsPosition?: 'left' | 'right'
  ref?: React.Ref<React.ElementRef<typeof AccordionPrimitive.Trigger>>
}

const AccordionTriggerTwo: React.FC<AccordionTriggerTwoProps> = ({
  className,
  icons,
  iconsPosition = 'right',
  children,
  ...props
}) => {
  return (
    <AccordionPrimitive.Header>
      <AccordionPrimitive.Trigger
        {...props}
        className={cn(
          'group flex w-full gap-2.5 rounded-t-lg px-4 py-3 text-left text-black hover:text-black [&[data-state=open]>svg.arrow]:rotate-180 [&[data-state=open]>svg.arrow]:text-black [&[data-state=open]>svg.minus]:block [&[data-state=open]>svg.plus]:hidden [&[data-state=open]]:border-b [&[data-state=open]]:border-gray-300 [&[data-state=open]]:bg-gray-200',
          className,
          iconsPosition === 'right' ? 'justify-between xl:gap-5' : ''
        )}
      >
        {iconsPosition === 'left' &&
          (icons === 'plus-minus' ? (
            <>
              <Plus className="plus h-[18px] w-[18px] shrink-0 text-gray-600 transition-transform duration-200" />
              <Minus className="minus hidden h-[18px] w-[18px] shrink-0 transition-transform duration-200" />
            </>
          ) : (
            <ChevronDown className="arrow h-[18px] w-[18px] shrink-0 text-gray-600 transition-transform duration-200" />
          ))}
        {children}
        {iconsPosition === 'right' &&
          (icons === 'plus-minus' ? (
            <>
              <Plus className="plus ml-auto h-[18px] w-[18px] shrink-0 text-gray-600 transition-transform duration-200" />
              <Minus className="minus ml-auto hidden h-[18px] w-[18px] shrink-0 transition-transform duration-200" />
            </>
          ) : (
            <ChevronDown className="arrow ml-auto h-[18px] w-[18px] shrink-0 text-gray-600 transition-transform duration-200 group-hover:text-black" />
          ))}
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}
AccordionTriggerTwo.displayName = AccordionPrimitive.Trigger.displayName

// ---------- AccordionContentTwo ----------
type AccordionContentTwoProps = React.ComponentPropsWithoutRef<
  typeof AccordionPrimitive.Content
> & {
  parentClassName?: string
  ref?: React.Ref<React.ElementRef<typeof AccordionPrimitive.Content>>
}

const AccordionContentTwo: React.FC<AccordionContentTwoProps> = ({
  className,
  children,
  parentClassName,
  ...props
}) => {
  return (
    <AccordionPrimitive.Content
      {...props}
      className={cn(
        'overflow-hidden px-4 text-left transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down',
        parentClassName
      )}
    >
      <div className={cn('', className)}>{children}</div>
    </AccordionPrimitive.Content>
  )
}
AccordionContentTwo.displayName = AccordionPrimitive.Content.displayName

export {
  Accordion,
  AccordionItem,
  AccordionItemTwo,
  AccordionTrigger,
  AccordionTriggerTwo,
  AccordionContent,
  AccordionContentTwo,
}
