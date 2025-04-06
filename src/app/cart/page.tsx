'use client'

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/ui/navigation';
import ImageCarousel from '@/components/ui/carousel';
import { formatDate } from '@/utils/format';
import FlightResults from '@/components/search/flightResults';
import { Suspense } from 'react';


interface HotelRoom {
  type: string;
  hotel: {
    name: string;
    address: string;
    city: string;
  };
  images?: string[];
}

interface Flight {
  id: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  availableSeats: number;
  currency: string;
  flightCost: number;
  status: string;
  duration: number;
  origin: {
    city: string;
    code: string;
    country: string;
    name: string;
  } | string;
  destination: {
    split(arg0: string): unknown;
    city: string;
    code: string;
    country: string;
    name: string;
  } | string;
  airline: {
    code: string;
    name: string;
  } | string;
}

interface Booking {
  id?: number;
  checkIn?: string;
  checkOut?: string;
  itinerary?: string;
  flights: Flight[];
  room?: HotelRoom;
  hotelCost?: number;
}

interface Hotel {
  id: number;
  name: string;
  logo?: string;
  address: string;
  city: string;
  starRating: number;
  images: string[];
  ownerId: number;
  createdAt: string;
  updatedAt: string;
}

interface Suggestion {
  hotels: Hotel[];
  checkIn: string;
}

interface BookingInfo {
  id: number;
  checkIn: string;
  checkOut: string;
  price: number;
  hotel: {
    name: string;
    address: string;
    city: string;
  };
  room: {
    type: string;
    hotel: {
      name: string;
      address: string;
      city: string;
    };
  };
}

export default function BookingPage() {
  const router = useRouter();
  const [infoParam, setInfoParam] = useState<BookingInfo | Flight[] | null>(null);

  const [booking, setBooking] = useState<Booking>({ flights: [] });
  const [suggestions, setSuggestions] = useState<Suggestion>({ hotels: [], checkIn: '' });
  const [flightSuggestions, setFlightSuggestions] = useState({ results: [] });
  const [loading, setLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const infoEncoded = params.get('bookings');
      if (infoEncoded) {
        try {
          const decodedData = JSON.parse(decodeURIComponent(infoEncoded));

          // Check if the data is an array (flights) or an object (hotel)
          const isArray = Array.isArray(decodedData);
          const isObject = typeof decodedData === 'object' && !isArray;

          if (isArray) {
            // Set infoParam to the array of flights
            setInfoParam(decodedData);
          } else if (isObject) {
            // Handle hotel booking
            const formattedHotelBooking: BookingInfo = {
              id: decodedData.id,
              checkIn: decodedData.checkIn,
              checkOut: decodedData.checkOut,
              price: decodedData.price,
              hotel: decodedData.hotel,
              room: decodedData.room,
            };

            setInfoParam(formattedHotelBooking);
          }
        } catch (error) {
          setMessage("Error parsing booking information.");
        }
      }
    }
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/users", {
          method: "GET",
          credentials: "include",
        });
        if (!response.ok) {
          router.push("/user/login");
          return;
        }
        const data = await response.json();
        if (data.user.role !== "HOTEL_OWNER" && data.user.role !== "REGULAR_USER") {
          router.push("/");
          return;
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/user/login");
      }
    };
    checkAuth();
    // fetchBooking();
  }, [router]);

  useEffect(() => {
    fetchBooking();
    setLoading(false);
  }, [infoParam]);  

  const fetchBooking = async () => {
    try {
      const response = await fetch('/api/bookings', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const data: Booking = await response.json();
      let hasFlights = Array.isArray(infoParam) && infoParam.length > 0;
      let hasHotel = infoParam && typeof infoParam === 'object' &&
        !Array.isArray(infoParam) &&
        Object.keys(infoParam).length > 0;

        const numFlight = Array.isArray(infoParam) ? infoParam.length : 0;

      if (response.ok) {
        setBooking(data);
        if (Object.keys(data).length === 0 && (hasHotel || hasFlights)) {
          handleCreateBooking(Boolean(hasHotel), Boolean(hasFlights), numFlight);
        } else if (Object.keys(data).length > 0 && (hasHotel || hasFlights)) {
          handleUpdateBooking(data, Boolean(hasHotel), Boolean(hasFlights));
        } else if (Object.keys(data).length > 0 && !(hasHotel || hasFlights)) {
          fetchSuggestions("Shanghai", data);
        } else {
          setMessage("Could not find booking");
        }
      }
    } catch (error) {
      // setMessage('Error fetching booking.');
    } 
  };

  if (loading)
  return (
    <>
      <Navigation />
      <div className="h-screen flex items-center justify-center">
        <p className="text-6xl text-center mt-4">Loading...</p>
      </div>
    </>
  );


  const handleCreateBooking = async (hasHotel: boolean, hasFlight: boolean, numFlight: number) => {
      if (!hasHotel && !hasFlight) return;

      try {
        const response = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itinerary: hasHotel ? 'HOTEL_RESERVATION' : numFlight === 1 ? 'FLIGHT_ONEWAY' : 'FLIGHT_ROUNDTRIP',
            flights: hasFlight ? infoParam : [],
            hotelRoom: hasHotel ? infoParam : {},
          }),
        });

        const data: Booking = await response.json();

        if (response.ok) {
          setInfoParam(null);
          setBooking(data);
          fetchSuggestions("Shanghai", data);
        } else {
          setMessage(response.statusText || 'Error creating booking.');
        }
      } catch (error) {
        const err = error as Error;
        setMessage(err.message || 'Error creating booking.');
      }
    };

  const handleUpdateBooking = async (data: Booking, hasHotel: boolean, hasFlight: boolean) => {
      if ((!hasHotel && !hasFlight) || !data) return;

      try {
        const response = await fetch('/api/bookings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: data.id,
            addFlight: hasFlight ? infoParam : [],
            addHotel: hasHotel ? infoParam : {},
          }),
        });

        const res: Booking = await response.json();
        if (response.ok) {
          setInfoParam(null);
          setBooking(res);
          fetchSuggestions("Shanghai", res);
        } else {
          setMessage(JSON.stringify({
            id: data.id,
            addFlight: hasFlight ? infoParam : [],
            addHotel: hasHotel ? infoParam : {},
          }));
        }
      } catch (error) {
        setMessage("Error updating booking");
      }
    };


  const fetchSuggestions = async (origin: string, data: Booking) => {
    if (!data) return;

    const date = data.checkIn ? data.checkIn : '';
    try {
      const itinerary = data.itinerary ?? '';
      const hasFlights = data.flights?.length > 0;

      const params = new URLSearchParams({
        itinerary,
        ...(date && { date }),
      });
 
      if (hasFlights) {
        let city = '';
        if (typeof data.flights[0].destination === "string") {
          const parts = data.flights[0].destination.split(',').map((s: string) => s.trim());
          if (parts.length >= 3) {
            city = parts[2];
          }
        }
        params.append('flightDestination', city);
        params.append('date', data.flights[0].arrivalTime);
      } else {
        params.append('hotel', data.room?.hotel.name ?? '');
        params.append('origin', origin);
        params.append('destination', data.room?.hotel.city ?? '');
        params.append('date', data.checkIn ?? '');
      }

      const response = await fetch(`/api/bookings/suggestions?${params.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const text = await response.json();
        setMessage(text.error.error);
      } else {
        const data = await response.json();
        if (hasFlights) {
          setSuggestions(data);
        } else {
          setFlightSuggestions(data.message);
        }
      }
    } catch (error) {
      setMessage('Error fetching suggestions.');
    }
  };

  const handleCheckout = () => {
    router.push('/checkout');
  };

  const handleFlightRedirect = (flights: Flight[]) => {
    const round = flights.length === 2;

    const params = new URLSearchParams();

    const origin = typeof flights[0].origin === "object" ? flights[0].origin.city : "";
    const departTime = flights[0].departureTime;

    if (round) {
      const destination = typeof flights[1].destination === "object" ? flights[1].destination.city : "";
      const arrivalTime = flights[1].arrivalTime;

      params.append("origin", origin);
      params.append("destination", destination);
      params.append("departTime", departTime);
      params.append("arrivalTime", arrivalTime);
    } else {
      const destination = typeof flights[0].destination === "object" ? flights[0].destination.city : "";
      const arrivalTime = flights[0].arrivalTime;

      params.append("origin", origin);
      params.append("destination", destination);
      params.append("departTime", departTime);
      params.append("arrivalTime", arrivalTime);
    }

    params.append("round", String(round));

    router.push(`/flight?${params.toString()}`);
  }

  const handleHotelRedirect = (hotel: Hotel, checkIn: string) => {
    const params = new URLSearchParams({
      name: hotel.name,
      city: hotel.city,
      starRating: hotel.starRating.toString(),
      checkIn: checkIn,
    });

    router.push(`/hotelsearch?${params.toString()}`);
  }

  return (
    <>
      <Navigation />
      <div className="mt-8 px-4">
        <h1 className="text-6xl font-bold mb-6">Cart</h1>

        {/* Booking Details */}
        <div className="bg-blue-300 p-6 rounded-xl shadow-md mb-6">
          <h2 className="text-3xl font-semibold text-blue-700 mb-4">Booking Details</h2>
          {Object.keys(booking).length > 1 ? (
            <div className="bg-blue-100 p-4 rounded-lg text-blue-800">
              <div className="flex flex-col md:flex-row gap-6 w-full">
                {booking.room && (
                  <div className="bg-white p-4 rounded-lg border shadow w-full break-all md:w-1/2">
                    <div className="flex flex-col gap-4 w-full">
                      {/* Hotel Info */}
                      <div className="w-full text-sm sm:text-base leading-relaxed break-words whitespace-normal">
                        <p><strong>Hotel: ${booking.hotelCost}</strong></p>
                        <p>{booking.room.hotel.name}, {booking.room.hotel.address}</p>
                        <p>Room {booking.room.type}, {formatDate(booking.checkIn)} — {formatDate(booking.checkOut)}</p>
                      </div>

                      {/* Carousel */}
                      {Array.isArray(booking.room.images) && booking.room.images.length > 0 && (
                        <ImageCarousel images={booking.room.images} />
                      )}
                    </div>
                  </div>
                )}

                {booking.flights?.length > 0 && (
                  <div className="bg-white p-4 rounded-lg border shadow space-y-4 md:w-1/2">
                    <h3 className="text-lg font-semibold">Flights</h3>

                    {booking.flights.map((flight, index) => (
                      <div key={`${flight.flightNumber}-${flight.departureTime}`} className="border-b pb-3">
                        <p><strong>Price:</strong> ${flight.flightCost.toFixed(2)}</p>
                        <p>{typeof flight.airline === "object" ? flight.airline.name : flight.airline}</p>
                        <p>{typeof flight.origin === "string" ? flight.origin : ""} → {typeof flight.destination === "string" ? flight.destination : ""}</p>
                        <p>{formatDate(flight.departureTime)} — {formatDate(flight.arrivalTime)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-lg text-gray-500 text-center mt-4">
              No booking found. Please make a booking to see details.
            </p>
          )}
        </div>

        <div className="bg-yellow-50 p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-2xl font-semibold text-yellow-800 mb-4">Suggestions</h2>

          {suggestions?.hotels?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestions.hotels.map((hotel, index) => (
                <div key={index} className="bg-white p-4 rounded-lg shadow-md flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{hotel.name}</h3>
                    <p>{hotel.address}, {hotel.city}</p>
                    <p>Check-in: {formatDate(suggestions.checkIn)}</p>
                    {hotel.images?.length > 0 && <ImageCarousel images={hotel.images} />}
                  </div>
                  <button
                    onClick={() => handleHotelRedirect(hotel, suggestions.checkIn)}
                    className="mt-4 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
                  >
                    View Hotel
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center">No hotel suggestions available at the moment.</p>
          )}

          {flightSuggestions?.results?.length > 0 ? (
            <>
              <FlightResults searchResults={flightSuggestions} onAddToCart={handleFlightRedirect as (flights: any[]) => void} />
            </>
          ) : (
            <p className="text-gray-500 text-center">No flight suggestions available at the moment.</p>
          )}
        </div>

        {/* <p>{message}</p> */}
        {/* Go to Checkout */}
        <div className="mt-8 text-center">
          <button
            className="px-6 py-3 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition"
            onClick={handleCheckout}
          >
            Go to Checkout
          </button>
        </div>
      </div>
    </>
  );
}
