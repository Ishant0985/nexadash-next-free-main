import { Card, CardContent } from '@/components/ui/card'
import React from 'react'

interface PageHeadingProps {
  heading: string;
  button1?: React.ReactNode;
  button2?: React.ReactNode;
  className?: string;
}

const PageHeading = ({ heading, button1, button2, className }: PageHeadingProps) => {
  // Check if any buttons are provided
  const hasButtons = Boolean(button1 || button2);
  
  return (
    <Card className={`px-5 py-3.5 text-base/5 shadow-sm font-semibold text-black ${className || ''}`}>
      <CardContent className="flex justify-between items-center p-0">
        <div>{heading}</div>
        {hasButtons && (
          <div className="flex gap-2">
            {button1 && button1}
            {button2 && button2}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default PageHeading