'use client';

import * as React from 'react';
import { JSX, useEffect, useState } from 'react';
import Navigation from '@/components/ui/navigation';
import ImageCarousel from '@/components/ui/carousel';
import { formatDate, extractName, getItineraryLabel } from '@/utils/format';
import { useRouter } from "next/navigation";


interface Booking {
    id: number;
    itinerary: string;
    checkIn?: string;
    checkOut?: string;
    hotelCost?: number;
    room?: {
        hotel: { name: string, address: string };
        type: string;
        images?: string[];
    };
    flights?: {
        flightId: number;
        flightCost: number;
        airline: string;
        origin: string;
        destination: string;
        departureTime: string;
        arrivalTime: string;
    }[];
    status: string;
    createdAt: string;
}

export default function Records() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [expanded, setExpanded] = useState<number | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [popupContent, setPopupContent] = useState<JSX.Element | null>(null);
    const router = useRouter();

    useEffect(() => {
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
        fetchBooking();
    }, [bookings, router]);

    const fetchBooking = async (): Promise<void> => {
        try {
            const response = await fetch('/api/records', {
                method: 'GET'
            });
            const data = await response.json();
            if (response.ok) {
                setBookings(data);
            } else {
                setMessage(response.statusText);
            }
        } catch (error) {
            setMessage("Error fetching booking");
        }
    };

    const toggleExpand = (id: number) => {
        setExpanded(prev => (prev === id ? null : id));
    };

    const verifyFlight = async (id: number) => {
        const res = await fetch(`/api/records/${id}/verify`, { method: 'GET' });
        const result = await res.json();

        const popup = (
            <div className="text-left">
                <h2 className="text-lg font-semibold mb-2">Booking Status: <span className="text-blue-600">{result.bookStatus}</span></h2>
                <ul className="list-disc list-inside">
                    {result.flightsStatus.map((status: string, idx: number) => (
                        <li key={idx}>Flight {idx + 1}: <span className="font-medium">{status}</span></li>
                    ))}
                </ul>
            </div>
        );

        setPopupContent(popup);
    };

    const cancelBooking = async (id: number, type: string) => {
        let res;
        if (type === "all" || (type === "hotel" && !bookings.find(b => b.id === id)?.flights?.length) || (type === "flights" && !bookings.find(b => b.id === id)?.room)) {
            res = await fetch(`/api/records/${id}`, {
                method: 'PATCH',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cancelType: "ALL", cancelFlight: true, cancelHotel: true })
            });
        } else if (type === "flights") {
            res = await fetch(`/api/records/${id}`, {
                method: 'PATCH',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cancelType: "PARTIAL", cancelFlight: true, cancelHotel: false })
            });
        } else if (type === "hotel") {
            res = await fetch(`/api/records/${id}`, {
                method: 'PATCH',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cancelType: "PARTIAL", cancelFlight: false, cancelHotel: true })
            });
        }

        if (!res) {
            setMessage('Cancellation failed.');
            return;
        }

        if (res.ok) {
            const data = await res.json();
            if (data.status && data.status === 'CANCELED') {
                setBookings(prev =>
                    prev.map(b =>
                        b.id === id
                            ? {
                                ...b,
                                status: 'CANCELED',
                                hotelCost: 0,
                                room: undefined,
                                flights: [],
                            }
                            : b
                    )
                );
            } else if (data.status) {
                setBookings(prev =>
                    prev.map(b =>
                        b.id === id
                            ? {
                                ...b,
                                hotelCost: data.hotelCost ?? undefined,
                                checkIn: data.checkIn ?? undefined,
                                checkOut: data.checkOut ?? undefined,
                                flights: data.flights ?? [],
                            }
                            : b
                    )
                );
            } else {
                setMessage('Deletion failed.')
            }
        }
    };


    const sortedBookings = [...bookings].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );


    return (
        <>
            <Navigation />
            {/* <p>{message}</p> */}
            {popupContent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4 text-center">
                        {popupContent}
                        <button
                            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                            onClick={() => setPopupContent(null)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
            <div className="bg-gray-300 text-black shadow-2xl rounded-lg p-6 min-h-screen max-w-4xl mx-auto mt-6">
                <h1 className="text-center text-black text-2xl font-bold mb-6 font-helvetica">My Bookings</h1>

                {sortedBookings.length === 0 ? (
                    <p className="text-gray-500 text-center py-6">No bookings found.</p>
                ) : (
                    sortedBookings.map((booking, index) => (
                        <div
                            key={booking.id}
                            className={`border rounded-lg mb-4 p-4 shadow ${booking.status === 'CANCELED' ? 'bg-gray-100 text-gray-500' : 'bg-blue-300'
                                }`}
                        >
                            <div
                                className={`flex justify-between items-center ${booking.status !== 'CANCELED' ? 'cursor-pointer' : ''
                                    }`}
                                onClick={() => booking.status !== 'CANCELED' && toggleExpand(booking.id)}
                            >
                                <span className="font-semibold">
                                    #{index + 1} - {getItineraryLabel(booking.itinerary)}<br />
                                </span>
                                <span>
                                    {booking.status === 'CANCELED'
                                        ? '❌ Cancelled'
                                        : expanded === booking.id
                                            ? '▲'
                                            : '▼'}
                                </span>
                            </div>

                            {/* Expanded details (only if not canceled and expanded) */}
                            {booking.status !== 'CANCELED' && expanded === booking.id && (
                                <div className="mt-4 space-y-3">
                                    {/* Hotel Info */}
                                    {booking.room && booking.hotelCost && (
                                        <div className="bg-gray-200 p-4 rounded-lg border shadow">
                                            <div className="flex flex-row justify-between items-start gap-4 mt-4">
                                                <div className="flex-1">
                                                    <strong>Hotel: ${booking.hotelCost}</strong> <br />
                                                    {booking.room.hotel.name}, {booking.room.hotel.address} <br />
                                                    Room {booking.room.type}, {formatDate(booking.checkIn)} — {formatDate(booking.checkOut)}
                                                    <br />
                                                    <br />
                                                    <br />
                                                    <button
                                                        className="mt-2 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                                                        onClick={() => cancelBooking(booking.id, 'hotel')}
                                                    >
                                                        Cancel Hotel
                                                    </button>
                                                </div>

                                                {Array.isArray(booking.room.images) && booking.room.images.length > 0 && (
                                                    <ImageCarousel images={booking.room.images} />
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Flights Section */}
                                    {Array.isArray(booking.flights) && booking.flights.length > 0 && (
                                        <div className="bg-gray-200 p-4 rounded-lg border shadow space-y-4">
                                            <h3 className="text-lg font-semibold">Flights</h3>

                                            {booking.flights.map(flight => (
                                                <div key={flight.flightId} className="border-b pb-3">
                                                    <p><strong>Price:</strong> ${flight.flightCost}</p>
                                                    <p>{extractName(flight.airline)}</p>
                                                    <p>{extractName(flight.origin)} → {extractName(flight.destination)}</p>
                                                    <p>{formatDate(flight.departureTime)} — {formatDate(flight.arrivalTime)}</p>
                                                </div>
                                            ))}

                                            {/* Cancel all flights button */}
                                            <button
                                                className="mt-2 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                                                onClick={() => cancelBooking(booking.id, 'flights')}
                                            >
                                                Cancel All Flights
                                            </button>
                                        </div>
                                    )}


                                    <div className="bottom">
                                        <strong>Total:</strong> $
                                        {(booking.hotelCost ?? 0) + (booking.flights?.reduce((acc, f) => acc + f.flightCost, 0) ?? 0)}
                                    </div>

                                    <div className="flex gap-4 mt-2">
                                        {Array.isArray(booking.flights) && booking.flights.length > 0 && (
                                            <button
                                                className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                                                onClick={() => verifyFlight(booking.id)}
                                            >
                                                Verify Flight
                                            </button>
                                        )}
                                        <button
                                            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                                            onClick={() => cancelBooking(booking.id, 'all')}
                                        >
                                            Cancel Entire Booking
                                        </button>
                                        <a
                                            href={`/api/records/${booking.id}/invoice`}
                                            target="_blank"
                                            className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
                                        >
                                            Get Invoice
                                        </a>
                                    </div>

                                    {message && (
                                        <div className={`mt-6 p-4 rounded-lg text-center ${message.includes('successful')
                                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                            : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                                            }`}>
                                            {message}
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
                    ))
                )}

            </div>
        </>
    );
}
