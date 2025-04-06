
export default function FlightCard({ flight }: { flight: any}) {
	return (
		<div className="border rounded-lg p-4 shadow-md">
			<h2 className="text-lg font-semibold">{flight.airline} - {flight.flightNumber}</h2>
			<p className="text-gray-500">{flight.from} → {flight.to}</p>
			<p className="text-gray-500">Departure: {flight.departureTime}</p>
			<p className="text-gray-500">Price: ${flight.price}</p>
		</div>
	);
}

