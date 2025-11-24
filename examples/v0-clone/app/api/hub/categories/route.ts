// app/api/hub/categories/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getHubVideoCategories } from "@/lib/db/hub-queries";

export async function GET(request: NextRequest) {
  try {
    const categories = await getHubVideoCategories();
    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
