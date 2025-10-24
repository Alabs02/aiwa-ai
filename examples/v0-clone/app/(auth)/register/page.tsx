import { redirect } from 'next/navigation'
import { auth } from '../auth'
import { AuthForm } from '@/components/auth-form'

export default async function RegisterPage() {
  const session = await auth()

  if (session) {
    redirect('/')
  }

  return (
    <>
      <div className="flex flex-col items-center justify-center space-y-2.5 text-center w-full">
        <h3 className="text-xl font-semibold font-heading text-foreground">
          Create your Aiwa account
        </h3>
        <p className="text-sm text-muted-foreground font-body">
          Your ideas deserve to go live.
        </p>
      </div>

      <div className="flex flex-col space-y-4 w-full md:w-[90%] 2xl:w-7/8">
        <AuthForm type="signup" />
      </div>
    </>
  )
}
