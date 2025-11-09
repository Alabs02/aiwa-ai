import { redirect } from "next/navigation";
import { auth } from "../auth";
import { AuthForm } from "@/components/auth-form";

export default async function RegisterPage() {
  const session = await auth();

  if (session) {
    redirect("/");
  }

  return (
    <>
      <div className="flex w-full flex-col items-center justify-center space-y-2.5 text-center">
        <h3 className="font-heading text-foreground text-xl font-semibold">
          Create your Aiwa account
        </h3>
        <p className="text-muted-foreground font-body text-sm">
          Your ideas deserve to go live.
        </p>
      </div>

      <div className="flex w-full flex-col space-y-4 md:w-[90%] 2xl:w-7/8">
        <AuthForm type="signup" />
      </div>
    </>
  );
}
