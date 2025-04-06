'use client';

interface DateProps {
  label: string;
  value: string;
  onChangeAction: (value: string) => void;
}

export default function Date({ label, value, onChangeAction }: DateProps) {
  return (
    <div>
      <label
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChangeAction(e.target.value)}
        className="w-full py-3 px-4 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
      />
    </div>
  );
}


// - FlightSearchPage (Smart)
//   - FlightSearchForm (Smart)
//     - Input (Dumb)
//     - DatePicker (Dumb)
//     - Button (Dumb)
//   - FlightResults (Smart)
//     - Card (Dumb)

