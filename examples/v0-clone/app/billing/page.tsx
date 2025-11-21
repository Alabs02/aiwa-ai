import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { BillingClient } from "@/components/billing/billing-client";

export default async function BillingPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return <BillingClient />;
}
