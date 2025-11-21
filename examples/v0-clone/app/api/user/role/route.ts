import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getUserRole } from "@/lib/db/billing-queries";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ role: "guest" });
    }

    const role = await getUserRole(session.user.id);
    return NextResponse.json({ role });
  } catch (error) {
    return NextResponse.json({ role: "user" });
  }
}
