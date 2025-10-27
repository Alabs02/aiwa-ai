import React from 'react'
import { cn } from '@/lib/utils'

interface AvatarProps {
  type: 'user' | 'assistant'
  initials?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
}

export function Avatar({ type, initials = 'U', className, size = 'md' }: AvatarProps) {
  if (type === 'assistant') {
    return (
      <div
        className={cn(
          'flex-shrink-0 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold shadow-sm',
          sizeClasses[size],
          className
        )}
      >
        AI
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex-shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-sm',
        sizeClasses[size],
        className
      )}
    >
      {initials}
    </div>
  )
}