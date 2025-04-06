import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import CityDropDown from '@/components/search/cityDropDown';

interface cityPickerProps {
  type: 'origin' | 'desti',
  onCitySelect: (type: 'origin' | 'desti', city: string) => void;
}

export default function CityPicker({ type, onCitySelect }: cityPickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({
    matchingCities: [],
    matchingAirports: []
  });

  useEffect(() => {
    if (query.length >= 1) {
      fetch(`/api/destinations?destination=${query}`)
        .then(response => response.json())
        .then(data => setResults(data))
        .catch(error => console.error('Error fetching city suggestions:', error));
    } else {
      setResults({
        matchingCities: [],
        matchingAirports: []
      })
    }
  }, [query]);

  const handleSelect = (city: string) => {
    setQuery(city);
    onCitySelect(type, city);
    setResults({
      matchingCities: [],
      matchingAirports: []
    });
  };

  return (
    <div className="relative">
      <Input
        name="Choose City"
        value={query}
        placeholder='City/Country/Airport Code'
        onChange={(event) => setQuery(event.target.value)}
      />
      <CityDropDown
        query={query}
        data={results}
        onSelectAction={handleSelect}
      />
    </div>
  );
}

