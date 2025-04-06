// smart component

'use client';
import { useState } from 'react';
import CityPicker from '@/components/search/cityPicker';
import { Button } from '@/components/ui/button';
import Date from '@/components/search/date';

interface onSearchProps {
  onSearchAction: (
    data: {
      origin: string;
      destination: string;
      date: string;
      round: boolean;
    }
  ) => void;
  initialValues?: {
    origin?: string;
    destination?: string;
    date?: string; // can be "2025-04-04" or "2025-04-04,2025-04-08" for round trip
    round?: boolean;
  };
}

export default function SearchForm({ onSearchAction, initialValues }: onSearchProps) {
  const [origin, setOrigin] = useState(initialValues?.origin || '');
  const [destination, setDesti] = useState(initialValues?.destination || '');
  const [departureDate, setDepartureDate] = useState(() => {
    if (initialValues?.date) return initialValues.date.split(',')[0];
    return '';
  });
  const [returnDate, setReturnDate] = useState(() => {
    if (initialValues?.round && initialValues?.date) return initialValues.date.split(',')[1] || '';
    return '';
  });
  const [isRound, setRound] = useState(initialValues?.round || false);

  const handleSubmit = () => {
    let date;
    if (isRound) {
      date = `${departureDate},${returnDate}`
    } else {
      date = `${departureDate}`
    }
    onSearchAction({
      origin, destination,
      date: date,
      round: isRound
    });
  };
  const handleCitySelect =
    (type: 'origin' | 'desti', city: string) => {
      if (type == 'origin')
        setOrigin(city);
      else
        setDesti(city);
    };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="container mx-auto px-8 py-12 max-w-screen-md lg:max-w-screen-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col items-center">

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            Find Your Flights
          </h1>
        </div>

        {/* Inputs Centered */}
        <div className="w-full flex flex-col items-center gap-6">
          <div className="w-full flex flex-col sm:flex-row gap-6 justify-center">
            <CityPicker
              type="origin"
              onCitySelect={handleCitySelect}
            />
            <CityPicker
              type="desti"
              onCitySelect={handleCitySelect}
            />
          </div>

          <div className="w-full flex flex-col sm:flex-row gap-6 justify-center">
            <Date label="Departure Date" value={departureDate} onChangeAction={setDepartureDate} />
            {isRound && (
              <Date label="Return Date" value={returnDate} onChangeAction={setReturnDate} />
            )}
          </div>
        </div>

        {/* Round Trip Checkbox */}
        <div className="mt-6 flex items-center gap-3">
          <input
            type="checkbox"
            checked={isRound}
            onChange={(e) => setRound(e.target.checked)}
            className="h-6 w-6 text-blue-600 rounded border-gray-300 focus:ring focus:ring-blue-300"
          />
          <span className="text-lg text-gray-900 dark:text-gray-100">Get a round trip?</span>
        </div>

        {/* Larger Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Button
            name="Search Flights"
            onClick={handleSubmit}
            className="w-full sm:w-2/3 px-8 py-4 text-xl text-gray-900 dark:text-gray-100 bg-gray-300 dark:bg-gray-700 rounded-lg shadow-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition font-semibold"
          >
            Search
          </Button>
        </div>

      </div>
    </div >
  );
}

