'use client';

import { useState } from 'react';
import AuthForm from '@/components/ui/AuthForm';
import { Button } from '@/components/ui/button';
import Navigation from "@/components/ui/navigation";

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [message, setMessage] = useState<string | null>(null);


  const handleAuth = async (data:
    {
      email: string;
      password: string;
      firstName?: string;
      lastName?: string;
      phoneNumber?: string;
      isHotelOwner?: boolean
    }) => {
    try {
      const endpoint = mode === 'signup' ? '/api/users' : '/api/users/status';
      const role = data.isHotelOwner ? "HOTEL_OWNER" : "REGULAR_USER";

      const body = mode === 'signup' ?
        { ...data, role }
        : { email: data.email, password: data.password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const responseData = await response.json();

      if (!response.ok) {
        setMessage(responseData.error || 'Something went wrong');
      } else {
        console.log('Login successful:', responseData);
        setMessage('Login successful! Redirecting...');
        setTimeout(() => (window.location.href = '/cart'), 1500);
      }
    } catch (error) {
      console.error('Unexpected error occurred:', error);
      setMessage('Unexpected error occurred');
    }
  };
  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-xl rounded-2xl p-8">
              <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
                {mode === 'login' ? 'Welcome Back' : 'Create Account'}
              </h1>
              <AuthForm
                mode={mode}
                onSubmitAction={handleAuth}
              />
              <div className="mt-8 text-center">
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {mode === 'signup' ? "Already have an account?" : "Don't have an account?"}
                </p>
                <Button
                  onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                  variant="outline"
                  className="w-full"
                >
                  {mode === 'signup' ? 'Log in' : 'Sign up'}
                </Button>
              </div>
              {message && (
                <div className={`mt-6 p-4 rounded-lg text-center ${message.includes('successful')
                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                  : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                  }`}>
                  {message}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

