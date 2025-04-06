import React from "react";

interface CityDropDownProp {
  query: string;
  data: {
    matchingCities: { city: string; country: string }[];
    matchingAirports: { id: string; code: string; name: string; city: string; country: string }[];
  };
  onSelectAction: (city: string) => void
}

export default function CityDropDown({ query, data, onSelectAction }: CityDropDownProp) {
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, "gi");
    return text.split(regex).map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? <strong key={index} className="text-blue-500">{part}</strong> : part
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 max-w-lg">
      <ul>
        {data.matchingCities.map(({ city, country }, index) => (
          <li
            key={`city-${index}`}
            className="p-2 border-b border-gray-200 dark:border-gray-700"
            onClick={() => onSelectAction(city)}
          >
            {highlightMatch(country, query)} - {highlightMatch(city, query)}
          </li>
        ))}

        {data.matchingAirports.map(({ id, code, name, city, country }) => (
          <li
            key={id}
            className="p-2 border-b border-gray-200 dark:border-gray-700"
            onClick={() => onSelectAction(code)}
          >
            {highlightMatch(country, query)} - {highlightMatch(city, query)} - <strong>{code}</strong> ({highlightMatch(name, query)})
          </li>
        ))}
      </ul>
    </div>
  );
}

