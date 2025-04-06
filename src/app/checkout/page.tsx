'use client';

import { useState, useEffect, useRef } from 'react';
import Navigation from '@/components/ui/navigation';
import { formatDate, extractName, getItineraryLabel } from '@/utils/format';
import { useRouter } from "next/navigation";


interface Booking {
    hotelCost?: number;
    room?: {
        hotel: { name: string, address: string };
        type: string;
    };
    checkIn?: string;
    checkOut?: string;
    flights?: {
        id: number;
        flightCost: number;
        airline: string;
        origin: string;
        destination: string;
        departureTime: string;
        arrivalTime: string;
    }[];
}

export default function Checkout() {
    const [bookings, setBookings] = useState<Booking>({ flights: [] });
    const [totalCost, setTotalCost] = useState<number>(0);
    const [paymentInfo, setPaymentInfo] = useState({
        cardNumber: '',
        expiry: '',
        cvv: '',
        passportNumber: ''
    });
    const lastExpiryRef = useRef<string>('');
    const [message, setMessage] = useState<string | null>(null);
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
    }, [router]);

    const fetchBooking = async (): Promise<void> => {
        try {
            const response = await fetch('/api/bookings/checkout', {
                method: 'GET'
            });
            const data = await response.json();
            if (response.ok) {
                setBookings(data);
                let total = data.hotelCost ?? 0;
                total += data.flights?.reduce((acc: number, flight: { flightCost: number }) => acc + flight.flightCost, 0) ?? 0;
                setTotalCost(total);
            } else {
                setMessage(response.statusText);
            }
        } catch (error) {
            setMessage('Error fetching booking.');
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let { name, value } = e.target;

        if (name === 'expiry') {
            const prev = lastExpiryRef.current;

            // Remove all non-digits
            let digits = value.replace(/\D/g, '');

            // If user is deleting the slash
            if (prev.length === 3 && value.length === 2) {
                value = value.slice(0, 2); // allow slash deletion
            } else {
                if (digits.length === 1) {
                    if (parseInt(digits) > 1) {
                        digits = '0' + digits;
                    }
                    value = digits;
                } else if (digits.length === 2) {
                    value = digits + '/';
                } else if (digits.length > 2) {
                    value = digits.slice(0, 2) + '/' + digits.slice(2, 4);
                }
            }

            lastExpiryRef.current = value;
        }

        setPaymentInfo({ ...paymentInfo, [name]: value });
    };

    const handleCheckout = async () => {
        try {
            const [expiryMonth, expiryYear] = paymentInfo.expiry.split('/');
            const response = await fetch('/api/bookings/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cardNumber: paymentInfo.cardNumber,
                    expiryMonth,
                    expiryYear,
                    cvv: paymentInfo.cvv,
                    booking: bookings,
                    passportNumber: paymentInfo.passportNumber
                })
            });

            const result = await response.json();
            if (response.ok) {
                setMessage('Payment successful!');
                router.push('/booking');
            } else {
                setMessage(result.error || 'Payment failed. Please make sure the inputs are all in valid format.');
            }
        } catch (error) {
            setMessage('Payment failed. Please try again later.');
        }
    };

    return (
        <>
            <Navigation />
            <div className="flex flex-col sm:flex-row justify-center w-full gap-8 p-8 md:p-10">
                <div className="md:w-1/2 p-6 bg-white shadow-lg rounded-lg mt-6">

                    <h2 className="text-2xl text-black font-semibold mt-6">Payment</h2>
                    <div className="text-gray-500 space-y-4 mt-4">
                        <input
                            type="text"
                            name="cardNumber"
                            placeholder="Card Number"
                            className="w-full p-2 border rounded"
                            onChange={handleInputChange}
                        />
                        <input
                            type="text"
                            name="expiry"
                            placeholder="Expiry Date (MM/YY)"
                            className="w-full p-2 border rounded"
                            value={paymentInfo.expiry}
                            onChange={handleInputChange}
                        />
                        <input
                            type="text"
                            name="cvv"
                            placeholder="CVV"
                            className="w-full p-2 border rounded"
                            onChange={handleInputChange}
                        />
                        <input
                            type="text"
                            name="passportNumber"
                            placeholder="Passport Number (Only required for flight booking)"
                            className="w-full p-2 border rounded"
                            onChange={handleInputChange}
                        />
                        <p className={message === "Payment successful!" ? "text-green-600" : "text-red-600"}>
                            {message}
                        </p>
                        <button onClick={handleCheckout} className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700">
                            Pay ${totalCost.toFixed(2)}
                        </button>
                    </div>
                </div>

                <div className="md:w-1/2 p-6 bg-white text-black shadow-lg rounded-lg mt-6">
                    <h2 className="text-2xl font-semibold">{bookings.flights ? bookings.flights.length + (bookings.hotelCost ? 1 : 0) : 0} Item</h2>
                    <ul className="divide-y divide-gray-300">
                        {bookings.hotelCost && bookings.room && (
                            <li className="flex justify-between py-2">
                                <p><strong>Hotel: ${bookings.hotelCost}</strong></p>
                                <p>{bookings.room.hotel.name}, {bookings.room.hotel.address}</p>
                                <p>Room {bookings.room.type}, {formatDate(bookings.checkIn)} — {formatDate(bookings.checkOut)}</p>
                            </li>
                        )}
                        {bookings.flights && bookings.flights.map((flight, index) => (
                            <li key={`${flight.airline}-${flight.departureTime}-${flight.id}`} className="flex justify-between py-2">
                                <p><strong>Price: ${flight.flightCost.toFixed(2)}</strong></p>
                                <p>{extractName(flight.airline)}</p>
                                <p>{extractName(flight.origin)} → {extractName(flight.destination)}</p>
                                <p>{formatDate(flight.departureTime)} — {formatDate(flight.arrivalTime)}</p>
                            </li>
                        ))}
                        <div className="relative">
                            <div className="text-xl font-semibold mt-4">Total: ${totalCost.toFixed(2)}</div>
                        </div>
                    </ul>
                </div>
            </div>
        </>
    );
}


