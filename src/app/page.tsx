'use client';

import Link from "next/link";
import Navigation from "@/components/ui/navigation";

export default function Home() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-xl rounded-2xl p-10 mb-12 text-center">
              <h1 className="text-5xl font-extrabold mb-6 text-gray-900 dark:text-white">Welcome to FlyNext</h1>
              <p className="text-xl text-gray-700 dark:text-gray-300 mb-10 max-w-xl mx-auto">
                Your one-stop destination for booking affordable flights and comfortable hotels — all in one place.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 mb-12 justify-center">
                <Link href="/flight" className="px-8 py-4 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition transform hover:scale-105">
                  ✈️ Book a Flight
                </Link>
                <Link href="/hotelsearch" className="px-8 py-4 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition transform hover:scale-105">
                  🏨 Find a Hotel
                </Link>
              </div>

              <div className="text-gray-700 dark:text-gray-300">
                <p className="mb-2">
                  Already booked? <Link href="/booking" className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300">Manage your bookings</Link>
                </p>
                <p>
                  New here? <Link href="/user/login" className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300">Log in or sign up</Link>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl shadow-lg p-6 hover:shadow-xl transition">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">✈️ Flights</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">Find the best deals on flights to your dream destination.</p>
                <Link href="/flight" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">Search flights →</Link>
              </div>

              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl shadow-lg p-6 hover:shadow-xl transition">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">🏨 Hotels</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">Discover comfortable accommodations for your stay.</p>
                <Link href="/hotelsearch" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">Find hotels →</Link>
              </div>

              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl shadow-lg p-6 hover:shadow-xl transition">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">📋 Bookings</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">Manage your existing bookings and travel plans.</p>
                <Link href="/booking" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">View bookings →</Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

