'use client';


import * as React from "react"
import { useState, useEffect } from 'react';
import {
    Sun, Moon, ShoppingCart,
    User, Plane, Bell
} from 'lucide-react';
import Link from 'next/link';
import { useUser } from "@/hook/useUser";
import { useTheme } from '@/components/ui/context';
import LogoutButton from '@/components/ui/LogoutButton';


export default function Navigation() {
    const { user } = useUser();
    const [darkMode, toggleDarkMode] = useTheme();
    const [isHotelOwner, setIsHotelOwner] = useState(false);

    // Check if the user is a hotel owner
    useEffect(() => {
        if (user) {
            setIsHotelOwner(user.role === 'HOTEL_OWNER');
        }
    }, [user]);

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-opacity-90 ${darkMode ? 'bg-gray-900/90' : 'bg-white/90'
            } border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'
            }`}>
            <div className="w-full px-4">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center space-x-2">
                        <Plane className={`w-8 h-8 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                        <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            FlyNext
                        </h1>
                    </Link>

                    {/* Main Navigation */}
                    <ul className="hidden md:flex items-center space-x-8">
                        <li>
                            <Link
                                href="/"
                                className={`text-sm font-medium transition-colors hover:text-blue-600 ${darkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-600'
                                    }`}
                            >
                                Home
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/flight"
                                className={`text-sm font-medium transition-colors hover:text-blue-600 ${darkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-600'
                                    }`}
                            >
                                Flights
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/hotelsearch"
                                className={`text-sm font-medium transition-colors hover:text-blue-600 ${darkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-600'
                                    }`}
                            >
                                Hotels
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/booking"
                                className={`text-sm font-medium transition-colors hover:text-blue-600 ${darkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-600'
                                    }`}
                            >
                                Bookings
                            </Link>
                        </li>
                        {isHotelOwner && (
                            <li>
                                <Link
                                    href="/hotel-management"
                                    className={`text-sm font-medium transition-colors hover:text-blue-600 ${darkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-600'
                                        }`}
                                >
                                    Manage Hotels
                                </Link>
                            </li>
                        )}
                    </ul>

                    {/* Right Side Actions */}
                    <div className="flex items-center space-x-4">
                        <Link
                            href="/cart"
                            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${darkMode
                                ? 'text-gray-300 hover:bg-gray-800 hover:text-blue-400'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'
                                }`}
                        >
                            <ShoppingCart size={20} />
                            <span className="text-sm font-medium">Cart</span>
                        </Link>

                        <button
                            onClick={toggleDarkMode}
                            className={`p-2 rounded-lg transition-colors ${darkMode
                                ? 'text-gray-300 hover:bg-gray-800 hover:text-blue-400'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'
                                }`}
                        >
                            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                        <Link
                            href="/notification">
                            <button className="bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-700">
                                <Bell size={20} />
                            </button>
                        </Link>

                        <Link href={user ? "/user/profile" : "/user/login"}>
                            <button
                                className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-lg transition-colors ${darkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                            >
                                <User size={20} />
                                <span className="text-sm font-medium hidden sm:inline">Profile</span>
                            </button>
                        </Link>
                        {user ?
                            (<LogoutButton isRed={true} />)
                            : (<LogoutButton isRed={false} />)
                        }
                    </div>

                    {/* Mobile Menu Button */}
                    <button className="md:hidden p-2 rounded-lg">
                        <svg
                            className={`w-6 h-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 6h16M4 12h16M4 18h16"
                            />
                        </svg>
                    </button>
                </div>
            </div>
        </nav>
    );
}





