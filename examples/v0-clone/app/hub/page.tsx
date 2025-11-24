import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { Toolbar } from "@/components/shared/toolbar";
import { VibeHubClient } from "@/components/hub/hub-client";
import { AppFooter } from "@/components/shared/app-footer";

export default async function VibeHubPage() {
  const session = await auth();

  return (
    <>
      <Toolbar />
      <VibeHubClient />
      <AppFooter />
    </>
  );
}
