'use client'

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { Flight } from "@/components/search/flightResults"
import SearchForm from "@/components/search/searchForm";
import FlightResults from "@/components/search/flightResults";
import Navigation from "@/components/ui/navigation";
import { Suspense } from 'react';


export default function FlightSearchPage() {
	const router = useRouter();
	const [searchResults, setSearchResults] = useState({ results: [] });
	const [loading, setLoading] = useState(true);

	const handleSearch = (searchParams:
		{
			origin: string;
			destination: string;
			date: string;
			round: boolean;
			arrive?: string;
		}
	) => {
		// Fetch flights from API
		fetch(`/api/flights?origin=${searchParams.origin}&destination=${searchParams.destination}&date=${searchParams.date}&round=${searchParams.round}`)
			.then(response => response.json())
			.then(data => setSearchResults(data))
			.catch(error => console.error('Error fetching city suggestions:', error));
	};

	const handleAddToCart = (flights: Flight[]) => {
		const params = new URLSearchParams({
			bookings: JSON.stringify(flights)
		});

		// Navigate to cart page with the parameters
		router.push(`/cart?${params.toString()}`);
	};

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);

		const origin = params.get('origin');
		const destination = params.get('destination');
		const departTime = params.get('departTime');
		const roundParam = params.get('round');
		let arrive = '';
		let date = '';

		// Only proceed if we have the necessary parameters in the URL
		if (origin && destination && departTime && roundParam !== null) {
		if (roundParam === 'true') {
			arrive = params.get('arrivalTime') || '';
			if (arrive) {
			const departDate = departTime.split('T')[0];  // Extract "YYYY-MM-DD"
			const arriveDate = arrive.split('T')[0];      // Extract "YYYY-MM-DD"
			date = `${departDate},${arriveDate}`;
			}
		} else {
			const departDate = departTime.split('T')[0];
			date = departDate;
		}

		const round = roundParam === 'true';

		// Call the handleSearch function only once the parameters are available
		handleSearch({ origin, destination, date, round });
		} else {
		// If parameters are missing or incomplete, skip the flight search logic
		console.log("Missing or incomplete parameters, skipping flight search.");
		}

		// Set loading to false immediately if parameters are missing
		setLoading(false);
	}, []);


	if (loading)
	return (
		<>
		<Navigation />
		<div className="h-screen flex items-center justify-center">
			<p className="text-6xl text-center mt-4">Loading...</p>
		</div>
		</>
	);

	return (
		<>
			<Navigation />
			<div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
				<SearchForm onSearchAction={handleSearch} />
				<FlightResults searchResults={searchResults}
					onAddToCart={handleAddToCart}
				/>
			</div>
		</>
	)
}

