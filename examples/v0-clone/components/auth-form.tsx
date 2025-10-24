'use client'

import { useActionState, useEffect } from 'react'
import { signInAction, signUpAction } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface AuthFormProps {
  type: 'signin' | 'signup'
}

export function AuthForm({ type }: AuthFormProps) {
  const [state, formAction, isPending] = useActionState(
    type === 'signin' ? signInAction : signUpAction,
    undefined,
  )

  // Show toast notifications when state changes
  useEffect(() => {
    if (state?.type === 'error') {
      toast.error(state.message)
    } else if (state?.type === 'success') {
      toast.success(state.message)
    }
  }, [state])

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="Email"
          required
          autoFocus
          className="w-full md:h-10 !font-body"
          disabled={isPending}
        />
      </div>
      <div>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Password"
          required
          className="w-full md:h-10 !font-body"
          minLength={type === 'signup' ? 6 : 1}
          disabled={isPending}
        />
      </div>

      <Button 
        type="submit" 
        className="w-full md:h-10 !font-button" 
        disabled={isPending}
      >
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isPending
          ? type === 'signin'
            ? 'Signing in...'
            : 'Creating account...'
          : type === 'signin'
            ? 'Sign In'
            : 'Create Account'}
      </Button>

      <div className="text-center text-sm text-muted-foreground font-body">
        {type === 'signin' ? (
          <>
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary hover:underline !font-button">
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline !font-button">
              Sign in
            </Link>
          </>
        )}
      </div>
    </form>
  )
}