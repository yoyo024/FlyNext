'use client' // Ensure this is at the top for client-side rendering

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic"; // Import Next.js dynamic module
import "leaflet/dist/leaflet.css"; // Import Leaflet CSS
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import Navigation from '@/components/ui/navigation';
import { useRouter } from 'next/navigation';
import Image from "next/image";
import { Suspense } from 'react';

// Dynamically import Leaflet components with no SSR
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });

const HotelSearchPage = () => {
    const router = useRouter();
    const [priceFilterVisible, setPriceFilterVisible] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchRoomType, setSearchRoomType] = useState('');
    const [starRating, setStarRating] = useState<number | "">("");
    const [startingPrice, setStartingPrice] = useState(0);
    const [maxPrice, setMaxPrice] = useState(50000000);
    const [checkInDate, setCheckInDate] = useState<string | "">("");
    const [checkOutDate, setCheckOutDate] = useState<string | "">("");
    const [hotelResults, setHotelResults] = useState<any[]>([]);
    const [selectedHotel, setSelectedHotel] = useState<any | null>(null);
    const [checkInRoomDate, setCheckInRoomDate] = useState<string | "">("");
    const [checkOutRoomDate, setCheckOutRoomDate] = useState<string | "">("");
    const [city, setCity] = useState<string | "">("");
    const [uniqueHotels, setUniqueHotels] = useState<any[]>([]);
    const [selectedHotelRooms, setSelectedHotelRooms] = useState<any[]>([]);

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const name = searchParams.get('name');
        const city = searchParams.get('city');
        const checkIn = searchParams.get('checkIn');
        const rating = searchParams.get('starRating');

        if (name) setSearchTerm(name);
        if (city) setCity(city);
        if (checkIn) {
            const date = new Date(checkIn);
            if (!isNaN(date.getTime())) {
                // Format to YYYY-MM-DD for date input
                const formatted = date.toISOString().split('T')[0];
                setCheckInDate(formatted);
            }
        }
        if (rating && !isNaN(Number(rating))) setStarRating(Number(rating));
    }, []);

    const fetchHotelRooms = async (hotelId: number, checkIn: string, checkOut: string) => {
        const params = new URLSearchParams();
        params.append("dateStart", checkIn);
        params.append("dateEnd", checkOut);

        try {
            console.log(`Fetching rooms for hotel ${hotelId} with dates:`, { checkIn, checkOut });
            const fetchResponse = await fetch(`/api/hotels/${hotelId}/rooms?${params.toString()}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!fetchResponse.ok) {
                const errorText = await fetchResponse.text();
                console.error('Server response:', {
                    status: fetchResponse.status,
                    statusText: fetchResponse.statusText,
                    body: errorText
                });
                throw new Error(`Network response was not ok: ${fetchResponse.status} ${fetchResponse.statusText}`);
            }

            const data = await fetchResponse.json();
            console.log('Fetched room data:', data);
            return data;
        } catch (error) {
            console.error('Error fetching rooms:', error);
            return [];
        }
    };

    const openSelectedHotel = async (hotel: any) => {
        setSelectedHotel(hotel);
        setSelectedHotelRooms(hotelResults.filter(room => room.hotel.id === hotel.hotel.id));
    };

    const handleRoomDateChange = async () => {
        if (!selectedHotel) return;

        // Call handleSearchAvailability when dates change
        handleSearchAvailability();
    };

    const closeHotelDetails = () => {
        setSelectedHotel(null);
        setSelectedHotelRooms([])
    };

    const handleSearchSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault(); // Prevent page reload

        // Construct the query string from parameters
        const params = new URLSearchParams();
        // Always include parameters, even if empty
        params.append("checkinDate", checkInDate || "");
        params.append("checkoutDate", checkOutDate || "");
        params.append("city", city || "");
        params.append("star", starRating ? String(starRating) : "");
        params.append("name", searchTerm || "");
        params.append("lowerpriceRange", String(startingPrice));
        params.append("upperpriceRange", String(maxPrice));


        try {
            const fetchResponse = await fetch(`/api/hotels?${params.toString()}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!fetchResponse.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await fetchResponse.json(); // Extract JSON data
            console.log("Fetched hotels:", data); // Debugging log
            setHotelResults(data); // Set the actual hotel data in state
            console.log("hotelResults", hotelResults)
            setUniqueHotels(data.filter((hotel: any, index: number, self: any[]) =>
                index === self.findIndex((h) => h.hotel.id === hotel.hotel.id) // Keep only first occurrence
            ));

        } catch (error) {
            console.error("Error fetching hotels:", error);
        }
    };


    const handlePriceClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setPriceFilterVisible((prev) => !prev);
    };

    const handleStarRatingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setStarRating(Number(e.target.value));
        console.log("star rating:", starRating);
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>, type: "start" | "max") => {
        const value = parseInt(e.target.value);
        if (!isNaN(value)) {
            if (type === "start") {
                setStartingPrice(value);
            } else {
                setMaxPrice(value);
            }
        }
        console.log("max val", maxPrice);
        console.log("min val", startingPrice);
    };

    // Add a new function to handle room availability search
    const handleSearchAvailability = async () => {
        if (!selectedHotel || !selectedHotel.hotel) return;

        try {
            if (checkInRoomDate && checkOutRoomDate) {
                // Make sure we're using the correct hotel ID
                const hotelId = selectedHotel.hotel.id;
                console.log('Searching rooms for hotel:', hotelId);

                // If dates are provided, fetch from API
                const rooms = await fetchHotelRooms(hotelId, checkInRoomDate, checkOutRoomDate);
                console.log('Fetched rooms:', rooms);

                let filteredRooms = rooms;

                // Apply room type filter if provided
                if (searchRoomType) {
                    filteredRooms = rooms.filter((room: any) =>
                        room.type.toLowerCase().includes(searchRoomType.toLowerCase())
                    );
                }

                setSelectedHotelRooms(filteredRooms);
            } else {
                // If no dates, show all rooms from initial results
                let rooms = hotelResults.filter(room => room.hotel.id === selectedHotel.hotel.id);

                // Apply room type filter if provided
                if (searchRoomType) {
                    rooms = rooms.filter((room: any) =>
                        room.type.toLowerCase().includes(searchRoomType.toLowerCase())
                    );
                }

                setSelectedHotelRooms(rooms);
            }
        } catch (error) {
            console.error('Error searching rooms:', error);
            setSelectedHotelRooms([]);
        }
    }

    const handleBookNow = (room: any) => {
        if (!checkInRoomDate || !checkOutRoomDate) {
            alert('Please select check-in and check-out dates first');
            return;
        }

        // Format dates to ISO string format
        const checkInISO = new Date(checkInRoomDate).toISOString();
        const checkOutISO = new Date(checkOutRoomDate).toISOString();

        // Create the booking info object
        const bookingInfo = {
            id: room.id,
            checkIn: checkInISO,
            checkOut: checkOutISO,
            price: room.pricePerNight,
            hotel: {
                name: selectedHotel.hotel.name,
                address: selectedHotel.hotel.address,
                city: selectedHotel.hotel.city
            },
            room: {
                type: room.type,
                hotel: {
                    name: selectedHotel.hotel.name,
                    address: selectedHotel.hotel.address,
                    city: selectedHotel.hotel.city
                }
            }
        };

        // Create URL parameters with the correct parameter name 'bookings'
        const params = new URLSearchParams({
            bookings: JSON.stringify(bookingInfo)
        });

        // Navigate to cart page with the parameters
        router.push(`/cart?${params.toString()}`);
    };

    return (
        <>
            <Navigation />
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
                <div className="container mx-auto px-4 py-8">
                    {/* Search Form Section */}
                    <div className="max-w-6xl mx-auto">
                        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-xl rounded-2xl p-8 mb-12">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Find Your Perfect Stay</h1>
                            <form className="flex flex-col md:flex-row gap-6" onSubmit={handleSearchSubmit}>
                                {/* Left Column */}
                                <div className="flex-1 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hotel Name</label>
                                            <input
                                                type="text"
                                                placeholder="Search for hotels"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full py-3 px-4 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">City</label>
                                            <input
                                                type="text"
                                                placeholder="Enter city"
                                                value={city}
                                                onChange={(e) => setCity(e.target.value)}
                                                className="w-full py-3 px-4 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Check-in Date</label>
                                            <input
                                                type="date"
                                                value={checkInDate}
                                                onChange={(e) => setCheckInDate(e.target.value)}
                                                className="w-full py-3 px-4 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Check-out Date</label>
                                            <input
                                                type="date"
                                                value={checkOutDate}
                                                onChange={(e) => setCheckOutDate(e.target.value)}
                                                className="w-full py-3 px-4 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column */}
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Guest Rating</label>
                                        <select
                                            value={starRating}
                                            onChange={handleStarRatingChange}
                                            className="w-full py-3 px-4 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        >
                                            <option value="">Select Rating</option>
                                            <option value={1}>1 Star</option>
                                            <option value={2}>2 Stars</option>
                                            <option value={3}>3 Stars</option>
                                            <option value={4}>4 Stars</option>
                                            <option value={5}>5 Stars</option>
                                        </select>
                                    </div>

                                    <div className="relative">
                                        <button
                                            onClick={handlePriceClick}
                                            className="w-full py-3 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            Price Range
                                        </button>
                                        {priceFilterVisible && (
                                            <div className="absolute mt-2 p-6 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 shadow-xl w-72 z-10">
                                                <div className="flex justify-between items-center mb-4">
                                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Price Range</h3>
                                                    <button
                                                        onClick={handlePriceClick}
                                                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Min Price</label>
                                                        <input
                                                            type="number"
                                                            placeholder="Min Price"
                                                            value={startingPrice}
                                                            className="w-full py-2 px-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                                            min="0"
                                                            onChange={(e) => handlePriceChange(e, "start")}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Max Price</label>
                                                        <input
                                                            type="number"
                                                            placeholder="Max Price"
                                                            value={maxPrice}
                                                            className="w-full py-2 px-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                                            min="0"
                                                            onChange={(e) => handlePriceChange(e, "max")}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                                    >
                                        Search Hotels
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Hotel Results Section */}
                        <div className="mb-12">
                            {uniqueHotels.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {uniqueHotels.map((eachhotel, index) => (
                                        <div
                                            key={index}
                                            className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                                            onClick={() => openSelectedHotel(eachhotel)}
                                        >
                                            <div className="relative h-48">
                                                <Image
                                                    width={500}
                                                    height={300}
                                                    src={eachhotel.hotel.logo || '/default-hotel.jpg'}
                                                    alt={eachhotel.hotel.name}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute top-4 right-4 bg-white dark:bg-gray-900 px-3 py-1 rounded-full shadow-md">
                                                    <span className="text-yellow-500">{"★".repeat(eachhotel.hotel.starRating)}</span>
                                                </div>
                                            </div>
                                            <div className="p-6">
                                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{eachhotel.hotel.name}</h3>
                                                <p className="text-gray-600 dark:text-gray-300 mb-2">{eachhotel.hotel.city}</p>
                                                <a
                                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(eachhotel.hotel.address)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm flex items-center"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <span className="mr-1">📍</span> View on Map
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl shadow-lg">
                                    <p className="text-xl text-gray-700 dark:text-gray-300">No hotels found matching your search criteria.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Hotel Details Modal */}
                    {selectedHotel && (
                        <Dialog open={!!selectedHotel} onOpenChange={closeHotelDetails}>
                            <DialogContent className="w-[1000px] h-[90vh] max-h-[90vh] overflow-hidden p-0 bg-white dark:bg-gray-900">
                                <DialogTitle className="sr-only">
                                    {selectedHotel.hotel.name} Details
                                </DialogTitle>

                                {/* Hotel Header */}
                                <div className="relative h-72 bg-gray-200 dark:bg-gray-800">
                                    <Image
                                        width={500}
                                        height={300}
                                        src={selectedHotel.hotel.logo || '/default-hotel.jpg'}
                                        alt={selectedHotel.hotel.name}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                                        <h2 className="text-3xl font-bold text-white mb-2">{selectedHotel.hotel.name}</h2>
                                        <div className="flex items-center text-white">
                                            <span className="mr-2">{"★".repeat(selectedHotel.hotel.starRating)}</span>
                                            <span>{selectedHotel.hotel.starRating} Stars</span>
                                        </div>
                                    </div>

                                    <DialogClose asChild>
                                        <button className="absolute top-6 right-6 p-2 rounded-full bg-white/90 dark:bg-gray-900/90 hover:bg-white dark:hover:bg-gray-800 transition-colors">
                                            <span className="text-xl font-bold text-gray-900 dark:text-white">✕</span>
                                        </button>
                                    </DialogClose>
                                </div>

                                {/* Scrollable Content */}
                                <div className="overflow-y-auto h-[calc(90vh-18rem)] p-6">
                                    {/* Hotel Info */}
                                    <div className="mb-8">
                                        <div className="flex items-center mb-4">
                                            <p className="text-gray-700 dark:text-gray-200 text-lg">{selectedHotel.hotel.address}</p>
                                        </div>
                                    </div>

                                    {/* Date and Room Type Selection */}
                                    <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl mb-8 shadow-sm">
                                        <h3 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Search Room Availability</h3>
                                        <div className="grid grid-cols-3 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Check-in</label>
                                                <input
                                                    type="date"
                                                    value={checkInRoomDate}
                                                    onChange={(e) => {
                                                        setCheckInRoomDate(e.target.value);
                                                        if (checkOutRoomDate) {
                                                            handleRoomDateChange();
                                                        }
                                                    }}
                                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                                    min={new Date().toISOString().split('T')[0]}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Check-out</label>
                                                <input
                                                    type="date"
                                                    value={checkOutRoomDate}
                                                    onChange={(e) => {
                                                        setCheckOutRoomDate(e.target.value);
                                                        if (checkInRoomDate) {
                                                            handleRoomDateChange();
                                                        }
                                                    }}
                                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                                    min={checkInRoomDate || new Date().toISOString().split('T')[0]}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Room Type</label>
                                                <input
                                                    type="text"
                                                    value={searchRoomType}
                                                    onChange={(e) => setSearchRoomType(e.target.value)}
                                                    placeholder="Any room type"
                                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleSearchAvailability}
                                            className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold"
                                        >
                                            Search Availability
                                        </button>
                                    </div>

                                    {/* Available Rooms */}
                                    <div className="space-y-6">
                                        <h3 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Available Rooms</h3>
                                        {selectedHotelRooms.length > 0 ? (
                                            selectedHotelRooms.map((room, index) => (
                                                <div
                                                    key={room.id}
                                                    className="flex items-start p-6 border border-gray-300 dark:border-gray-600 rounded-xl hover:shadow-lg transition-shadow bg-white dark:bg-gray-900"
                                                >
                                                    <div className="flex-1">
                                                        <h4 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">{room.type}</h4>
                                                        <div className="text-sm text-gray-700 dark:text-gray-200 mb-4 grid grid-cols-2 gap-2">
                                                            {room.amenities && typeof room.amenities === 'string'
                                                                ? JSON.parse(room.amenities).map((amenity: string, index: number) => (
                                                                    <span key={`${room.id}-amenity-${index}`} className="flex items-center">
                                                                        <span className="mr-2">•</span>
                                                                        {amenity}
                                                                    </span>
                                                                ))
                                                                : Array.isArray(room.amenities) && room.amenities.map((amenity: string, index: number) => (
                                                                    <span key={`${room.id}-amenity-${index}`} className="flex items-center">
                                                                        <span className="mr-2">•</span>
                                                                        {amenity}
                                                                    </span>
                                                                ))
                                                            }
                                                        </div>
                                                        <div className="mt-4">
                                                            <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                                                ${room.pricePerNight}
                                                            </span>
                                                            <span className="text-gray-700 dark:text-gray-200 text-base ml-2">per night</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold"
                                                        onClick={() => handleBookNow(room)}
                                                    >
                                                        Book Now
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                                <p className="text-xl text-gray-700 dark:text-gray-200">
                                                    {searchRoomType
                                                        ? "No rooms match your search criteria"
                                                        : "No rooms available"}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </div>
        </>
    );
};

export default HotelSearchPage;
