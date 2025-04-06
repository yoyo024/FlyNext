import { prisma } from "../utils/db.js";

const AFS_CITY_URL = "https://advanced-flights-system.replit.app/api/cities";
const AFS_AIRPORT_URL = "https://advanced-flights-system.replit.app/api/airports";
const AFS_API_KEY= process.env.AFS_API_KEY;

async function fetchAndStore() {

  const cityResponse = await fetch(AFS_CITY_URL, {
    method: "GET",
    headers: {
      "accept": "application/json",
      "x-api-key": AFS_API_KEY
    }
  });
  const airportResponse = await fetch(AFS_AIRPORT_URL, {
    method: "GET",
    headers: {
      "accept": "application/json",
      "x-api-key": AFS_API_KEY
    }
  });

  if (!cityResponse.ok) {
    console.log("Failed to fetch list of cities from AFS");
    console.log("Failed to fetch list of airports from AFS");
    return;
  }
  if (!airportResponse.ok) {
    console.log("Failed to fetch list of airports from AFS");
    return;
  }

  const cities = await cityResponse.json();
  const airports = await airportResponse.json();

  for (const city of cities) {
    var city_data = await prisma.City.findUnique({where:{city: city.city}});
    if (!city_data)
      await prisma.City.create({ data: city });
  }
  for (const airport of airports) {
    var airport_data = await prisma.airport.findUnique({where:{code : airport.code}});
    if (!airport_data)
      await prisma.Airport.create({ data: airport });
  }
}

fetchAndStore()
  .then(() => {
    console.log("Get city and airports successfully.");
    process.exit(0);
  })
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
