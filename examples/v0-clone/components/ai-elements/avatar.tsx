import React from 'react'
import { cn } from '@/lib/utils'

interface AvatarProps {
  type: 'user' | 'assistant'
  initials?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'size-6 text-[10px]',
  md: 'size-8 text-xs',
  lg: 'size-10 text-sm',
}

export function Avatar({
  type,
  initials = 'U',
  className,
  size = 'md',
}: AvatarProps) {
  if (type === 'assistant') {
    return (
      <div
        className={cn(
          'p-0.5 relative grid place-items-center shadow-inner rounded-full bg-gradient-to-br from-neutral-50 via-neutral-500 to-neutral-800 hover:from-neutral-800 hover:via-neutral-500 hover:to-neutral-50 brightness-100 hover:brightness-110 transition-all duration-300 cursor-pointer will-change-auto transform-gpu',
          sizeClasses[size],
          className,
        )}
      >
        <div className="size-full grid grid-cols-1 relative bg-black rounded-full shadow-md skew-2 !font-button">
          AI
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'p-0.5 relative grid place-items-center shadow-inner rounded-full bg-gradient-to-br from-neutral-50 via-neutral-500 to-neutral-800 hover:from-neutral-800 hover:via-neutral-500 hover:to-neutral-50 brightness-100 hover:brightness-110 transition-all duration-300 cursor-pointer will-change-auto transform-gpu',
        sizeClasses[size],
        className,
      )}
    >
      <div className="size-full grid grid-cols-1 relative bg-black rounded-full shadow-md skew-2 !font-button">
        {initials}
      </div>
    </div>
  )
}
