'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface DivProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>
}

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  ref?: React.Ref<HTMLHeadingElement>
}

interface ParagraphProps extends React.HTMLAttributes<HTMLParagraphElement> {
  ref?: React.Ref<HTMLParagraphElement>
}

const Card: React.FC<DivProps> = ({ className, ref, ...props }) => (
  <div ref={ref} className={cn('shadow-3xl rounded-lg bg-white', className)} {...props} />
)
Card.displayName = 'Card'

const CardHeader: React.FC<DivProps> = ({ className, ref, ...props }) => (
  <div ref={ref} className={cn('', className)} {...props} />
)
CardHeader.displayName = 'CardHeader'

const CardTitle: React.FC<HeadingProps> = ({ className, ref, ...props }) => (
  <h3 ref={ref} className={cn('', className)} {...props} />
)
CardTitle.displayName = 'CardTitle'

const CardDescription: React.FC<ParagraphProps> = ({ className, ref, ...props }) => (
  <p ref={ref} className={cn('', className)} {...props} />
)
CardDescription.displayName = 'CardDescription'

const CardContent: React.FC<DivProps> = ({ className, ref, ...props }) => (
  <div ref={ref} className={cn('', className)} {...props} />
)
CardContent.displayName = 'CardContent'

const CardFooter: React.FC<DivProps> = ({ className, ref, ...props }) => (
  <div ref={ref} className={cn('', className)} {...props} />
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
