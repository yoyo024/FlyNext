
export const getItineraryLabel = (code: string): string => {
    switch (code) {
      case 'HOTEL_RESERVATION':
        return 'Hotel Reservation';
      case 'FLIGHT_ONEWAY':
        return 'One-way Flight';
      case 'FLIGHT_ROUNDTRIP':
        return 'Roundtrip Flight';
      case 'ONEWAY_AND_HOTEL':
        return 'One-way Flight and Hotel';
      case 'ROUNDTRIP_AND_HOTEL':
        return 'Roundtrip Flight and Hotel';
      default:
        return 'Unknown Itinerary';
    }
};

export const formatDate = (dateStr?: string): string => {
  if (!dateStr) return 'N/A';

  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    timeZone: 'UTC', 
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export const extractName = (input: string): string => {
    const firstCommaIndex: number = input.indexOf(',');
    if (firstCommaIndex === -1) return input;
  
    return input.slice(firstCommaIndex + 1).trim();
}