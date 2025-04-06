// As a visitor, I want to search for flights by specifying a source,
// destination, and date(s). Source and destination could be either a
// city or an airport. I want to search for one-way or round-trip flights.

// As a visitor, I want to view flight details, including departure/arrival
// times, duration, and layovers.

// /api/flight

import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";

const AFS_API_URL = "https://advanced-flights-system.replit.app/api/flights";
const AFS_API_KEY = process.env.AFS_API_KEY;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const origin = searchParams.get("origin");
    const destination = searchParams.get("destination");
    const date = searchParams.get("date");
    const round = searchParams.get("round");

    if (!origin || !destination || !date) {
      return NextResponse.json(
        { error: "Missing parameter to search" },
        { status: 400 },
      );
    }

    if (typeof origin !== "string" || typeof destination !== "string") {
      return NextResponse.json(
        { error: "Type of origin and destination must be string" },
        { status: 400 },
      );
    }
    const origin_in_city = await prisma.city.findUnique({
      where: { city: origin },
    });
    const origin_in_airport = await prisma.airport.findUnique({
      where: { code: origin },
    });
    const destination_in_city = await prisma.city.findUnique({
      where: { city: destination },
    });
    const destination_in_airport = await prisma.airport.findUnique({
      where: { code: destination },
    });

    if (!origin_in_city && !origin_in_airport) {
      return NextResponse.json(
        { error: "Can't find origin in database" },
        { status: 403 },
      );
    }
    if (!destination_in_city && !destination_in_airport) {
      return NextResponse.json(
        { error: "Can't find destination in database" },
        { status: 404 },
      );
    }

    const urls = [];
    var times = 1;
    if (round && JSON.parse(round.toLowerCase())) {
      times = 2;
      const dates = date.split(",");
      if (dates.length == 1) {
        return NextResponse.json(
          { error: "Only 1 date recieved, expecting 2 for round trip" },
          { status: 401 },
        );
      } else if (dates.length > 2) {
        return NextResponse.json(
          { error: "Too many dates, expecting 2 for round trip" },
          { status: 402 },
        );
      }

      const queryParams = new URLSearchParams({
        origin: origin,
        destination: destination,
        date: dates[0],
      });
      urls.push(AFS_API_URL + "?" + queryParams.toString());

      const queryParams2 = new URLSearchParams({
        origin: destination,
        destination: origin,
        date: dates[1],
      });
      urls.push(AFS_API_URL + "?" + queryParams2.toString());
    } else {
      const queryParams = new URLSearchParams({ origin, destination, date });
      urls.push(AFS_API_URL + "?" + queryParams.toString());
    }

    // fetch from AFS
    console.log(urls);
    var flights = { results: [] };
    for (var i = 0; i < times; i++) {
      const afsResponse = await fetch(urls[i], {
        method: "GET",
        headers: {
          accept: "application/json",
          "x-api-key": AFS_API_KEY,
        },
      });

      if (!afsResponse.ok) {
        return NextResponse.json(
          { error: "Failed to fetch flights from AFS" },
          { status: afsResponse.status },
        );
      }

      const flight = await afsResponse.json();
      console.log(flight);
      flights.results = flights.results.concat(flight.results);
    }
    return NextResponse.json(flights);
  } catch (error) {
    console.log("fetch flight error", error);
    return NextResponse.json(
      { message: "fetch flight error" },
      { status: 500 },
    );
  }
}
