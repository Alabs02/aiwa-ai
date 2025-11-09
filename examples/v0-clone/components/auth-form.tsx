"use client";

import { useActionState, useEffect, useState } from "react";
import { signInAction, signUpAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";

interface AuthFormProps {
  type: "signin" | "signup";
}

export function AuthForm({ type }: AuthFormProps) {
  const [state, formAction, isPending] = useActionState(
    type === "signin" ? signInAction : signUpAction,
    undefined
  );
  const [showPassword, setShowPassword] = useState(false);

  // Show toast notifications when state changes
  useEffect(() => {
    if (state?.type === "error") {
      toast.error(state.message);
    } else if (state?.type === "success") {
      toast.success(state.message);
    }
  }, [state]);

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
          className="!font-body w-full md:h-10"
          disabled={isPending}
        />
      </div>
      <div className="relative">
        <Input
          id="password"
          name="password"
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          required
          className="!font-body w-full pr-10 md:h-10"
          minLength={type === "signup" ? 6 : 1}
          disabled={isPending}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
          disabled={isPending}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>

      <Button
        type="submit"
        className="!font-button w-full md:h-10"
        disabled={isPending}
      >
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isPending
          ? type === "signin"
            ? "Signing in..."
            : "Creating account..."
          : type === "signin"
            ? "Sign In"
            : "Create Account"}
      </Button>

      <div className="text-muted-foreground font-body text-center text-sm">
        {type === "signin" ? (
          <>
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-primary !font-button hover:underline"
            >
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary !font-button hover:underline"
            >
              Sign in
            </Link>
          </>
        )}
      </div>
    </form>
  );
}
