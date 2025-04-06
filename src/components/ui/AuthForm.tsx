'use client';
import * as React from "react"
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface AuthFormProps {
	mode: 'login' | 'signup';
	onSubmitAction: (
		data: {
			email: string;
			password: string;
			firstName?: string;
			lastName?: string;
			phoneNumber?: string;
			isHotelOwner?: boolean
		}
	) => void;
}

export default function AuthForm({ mode, onSubmitAction }: AuthFormProps) {

	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [phoneNumber, setPhoneNumber] = useState('');
	const [isHotelOwner, setIsHotelOwner] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		onSubmitAction({ email, password, firstName, lastName, phoneNumber, isHotelOwner });
		setEmail("");
		setPassword("");
		setFirstName("");
		setLastName("");
		setPhoneNumber("");
		setIsHotelOwner(false);
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="space-y-6"
		>
			<div className="space-y-4">
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
						Email
					</label>
					<Input
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						className="w-full"
						required
					/>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
						Password
					</label>
					<Input
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className="w-full"
						required
					/>
				</div>
			</div>

			{mode === "signup" && (
				<div className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
								First Name
							</label>
							<Input
								type="text"
								value={firstName}
								onChange={(e) => setFirstName(e.target.value)}
								className="w-full"
								required
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
								Last Name
							</label>
							<Input
								type="text"
								value={lastName}
								onChange={(e) => setLastName(e.target.value)}
								className="w-full"
								required
							/>
						</div>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							Phone Number
						</label>
						<Input
							type="tel"
							value={phoneNumber}
							onChange={(e) => setPhoneNumber(e.target.value)}
							className="w-full"
						/>
					</div>
					<div className="flex items-center space-x-2">
						<input
							type="checkbox"
							id="isHotelOwner"
							checked={isHotelOwner}
							onChange={(e) => setIsHotelOwner(e.target.checked)}
							className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
						/>
						<label htmlFor="isHotelOwner" className="text-sm text-gray-700 dark:text-gray-300">
							I am a hotel owner
						</label>
					</div>
				</div>
			)}

			<Button
				type="submit"
				className="w-full"
			>
				{mode === "signup" ? "Sign Up" : "Login"}
			</Button>
		</form>
	)
};
