'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { FileCode, FileText, Folder, Sparkles } from 'lucide-react'

const generationStages = [
  { icon: Sparkles, text: 'Analyzing your request...', file: '' },
  { icon: Folder, text: 'Setting up project structure...', file: 'Creating workspace' },
  { icon: FileCode, text: 'Generating components...', file: 'app/components/ui' },
  { icon: FileCode, text: 'Writing application logic...', file: 'app/page.tsx' },
  { icon: FileText, text: 'Applying styles...', file: 'styles/globals.css' },
  { icon: FileCode, text: 'Configuring dependencies...', file: 'package.json' },
  { icon: Sparkles, text: 'Building your app...', file: '' },
]

interface PreviewLoadingAnimationProps {
  className?: string
}

export function PreviewLoadingAnimation({ className }: PreviewLoadingAnimationProps) {
  const [currentStage, setCurrentStage] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStage((prev) => (prev + 1) % generationStages.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const stage = generationStages[currentStage]
  const Icon = stage.icon

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-black',
        className,
      )}
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 overflow-hidden opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 animate-gradient" />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-6 max-w-md px-8">
        {/* Icon animation */}
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/20 dark:bg-blue-400/20 rounded-full blur-xl animate-pulse" />
          <div className="relative bg-white dark:bg-gray-900 rounded-full p-6 shadow-lg">
            <Icon className="h-12 w-12 text-blue-600 dark:text-blue-400 animate-bounce" />
          </div>
        </div>

        {/* Status text */}
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 animate-fade-in">
            {stage.text}
          </p>
          {stage.file && (
            <p className="text-sm text-gray-600 dark:text-gray-400 font-mono animate-slide-up">
              {stage.file}
            </p>
          )}
        </div>

        {/* Progress dots */}
        <div className="flex gap-2">
          {generationStages.map((_, index) => (
            <div
              key={index}
              className={cn(
                'h-2 w-2 rounded-full transition-all duration-300',
                index === currentStage
                  ? 'bg-blue-600 dark:bg-blue-400 scale-125'
                  : 'bg-gray-300 dark:bg-gray-700',
              )}
            />
          ))}
        </div>

        {/* Skeleton preview cards */}
        <div className="w-full space-y-3 mt-8">
          <div className="h-20 bg-white dark:bg-gray-900 rounded-lg shadow-sm animate-pulse-slow" />
          <div className="h-32 bg-white dark:bg-gray-900 rounded-lg shadow-sm animate-pulse-slow delay-100" />
          <div className="h-24 bg-white dark:bg-gray-900 rounded-lg shadow-sm animate-pulse-slow delay-200" />
        </div>
      </div>

      <style jsx>{`
        @keyframes gradient {
          0%, 100% { transform: translateX(-50%) translateY(-50%) rotate(0deg); }
          50% { transform: translateX(-30%) translateY(-30%) rotate(180deg); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { transform: translateY(10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-gradient {
          animation: gradient 8s ease-in-out infinite;
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.5s ease-out;
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
        .delay-100 {
          animation-delay: 100ms;
        }
        .delay-200 {
          animation-delay: 200ms;
        }
      `}</style>
    </div>
  )
}

interface CodeGenerationAnimationProps {
  className?: string
}

export function CodeGenerationAnimation({ className }: CodeGenerationAnimationProps) {
  const [lines, setLines] = useState<string[]>([])

  const codeLines = [
    "import { useState } from 'react'",
    '',
    'export default function App() {',
    '  const [count, setCount] = useState(0)',
    '',
    '  return (',
    '    <div className="container">',
    '      <h1>Your App</h1>',
    '      <button onClick={() => setCount(count + 1)}>',
    '        Count: {count}',
    '      </button>',
    '    </div>',
    '  )',
    '}',
  ]

  useEffect(() => {
    let currentIndex = 0
    const interval = setInterval(() => {
      if (currentIndex < codeLines.length) {
        setLines((prev) => [...prev, codeLines[currentIndex]])
        currentIndex++
      } else {
        // Reset and start over
        setLines([])
        currentIndex = 0
      }
    }, 150)

    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-gray-50 dark:bg-black overflow-hidden',
        className,
      )}
    >
      {/* Editor header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <span className="text-sm text-gray-600 dark:text-gray-400 ml-2 font-mono">
          app/page.tsx
        </span>
        <div className="ml-auto flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Generating...
          </span>
        </div>
      </div>

      {/* Code content */}
      <div className="flex-1 overflow-auto p-4 bg-white dark:bg-gray-900 font-mono text-sm">
        {lines.map((line, index) => (
          <div
            key={index}
            className="animate-fade-in-line"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <span className="text-gray-400 dark:text-gray-600 select-none mr-4">
              {(index + 1).toString().padStart(2, ' ')}
            </span>
            <span className="text-gray-800 dark:text-gray-200">{line || ' '}</span>
          </div>
        ))}
        <div className="inline-block w-2 h-4 bg-blue-600 dark:bg-blue-400 animate-blink" />
      </div>

      <style jsx>{`
        @keyframes fade-in-line {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .animate-fade-in-line {
          animation: fade-in-line 0.3s ease-out forwards;
        }
        .animate-blink {
          animation: blink 1s step-end infinite;
        }
      `}</style>
    </div>
  )
}