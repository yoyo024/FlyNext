import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";

export async function GET() {
  try {
    const cities = await prisma.city.findMany({
      select: {
        city: true,
        country: true
      },
      orderBy: {
        city: 'asc'
      }
    });

    return NextResponse.json(cities);
  } catch (error) {
    console.error("Error fetching cities:", error);
    return NextResponse.json(
      { error: "Failed to fetch cities" },
      { status: 500 }
    );
  }
} 