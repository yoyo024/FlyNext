// As a visitor, I want to have an auto-complete dropdown to suggest
// cities and airports as I type in the source or destination field.

// /api/flight

import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const desti = searchParams.get("destination");

    if (!desti) {
      return NextResponse.json({ error: "nothing to search" }, { status: 400 });
    }
    if (typeof desti !== "string") {
      return NextResponse.json(
        { error: "type of destination must be string" },
        { status: 400 },
      );
    }

    // fetch from db
    const city = await prisma.city.findMany({});
    const airport = await prisma.airport.findMany({});

    const matchingCities = city.filter(
      (c) => c.city.startsWith(desti) || c.country.startsWith(desti),
    );
    const matchingAirports = airport.filter(
      (a) =>
        a.name.startsWith(desti) ||
        a.city.startsWith(desti) ||
        a.code.startsWith(desti),
    );

    return NextResponse.json({ matchingCities, matchingAirports });
  } catch (error) {
    console.log("fetch destination city/airport error", error);
    return NextResponse.json(
      { message: "fetch destination city/airport error" },
      { status: 500 },
    );
  }
}
