import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { getUserRole } from "@/lib/db/billing-queries";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export default async function StudioPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const role = await getUserRole(session.user.id);

  if (role !== "admin") {
    redirect("/");
  }

  return <AdminDashboard />;
}
