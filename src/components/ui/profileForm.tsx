'use client';
import * as React from "react"
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ImageCarousel from '@/components/ui/img';
import LogoutButton from '@/components/ui/LogoutButton';

interface ProfileFormProps {
	mode: 'edit' | 'view'
	user: {
		email: string;
		password: string;
		firstName: string;
		lastName: string;
		phoneNumber: string;
		profilePicture?: string;
	}
	onUpdateAction: (
		user: {
			email: string;
			password: string;
			firstName: string;
			lastName: string;
			phoneNumber: string;
			profilePicture?: string
		},
		doUpdate: boolean
	) => void;
}

export default function ProfileForm(
	{ mode, user, onUpdateAction }: ProfileFormProps
) {
	const [email, setEmail] = useState(user.email);
	const [password, setPassword] = useState(user.password)
	const [firstName, setFirstName] = useState(user.firstName);
	const [lastName, setLastName] = useState(user.lastName);
	const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber);
	const [profilePicture, setProfilePicture] = useState(user.profilePicture || 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fstatic.vecteezy.com%2Fsystem%2Fresources%2Fpreviews%2F036%2F280%2F650%2Fnon_2x%2Fdefault-avatar-profile-icon-social-media-user-image-gray-avatar-icon-blank-profile-silhouette-illustration-vector.jpg&f=1&nofb=1&ipt=ff33013f8fab355fcd1f7dc31eb5e869b21b77b46a56a81159a52cb4f6ec32f4&ipo=images');
	const [doUpdate, setDoUpdate] = useState(false);

	const handleSubmit = async () => {
		if (doUpdate) {
			const updatedUser = {
				email,
				password,
				firstName,
				lastName,
				phoneNumber,
				profilePicture,
			};
			onUpdateAction(updatedUser, doUpdate);
		} else {
			setEmail(user.email);
			setPassword(user.password);
			setFirstName(user.firstName);
			setLastName(user.lastName);
			setPhoneNumber(user.phoneNumber);
			setProfilePicture(user.profilePicture || 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fstatic.vecteezy.com%2Fsystem%2Fresources%2Fpreviews%2F036%2F280%2F650%2Fnon_2x%2Fdefault-avatar-profile-icon-social-media-user-image-gray-avatar-icon-blank-profile-silhouette-illustration-vector.jpg&f=1&nofb=1&ipt=ff33013f8fab355fcd1f7dc31eb5e869b21b77b46a56a81159a52cb4f6ec32f4&ipo=images');
			onUpdateAction(user, doUpdate);
		}
	};

	return (
		<div className="space-y-8">
			<div className="text-center">
				<h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
					{mode === "edit" ? 'Edit Profile' : `${firstName}'s Profile`}
				</h1>
				<p className="text-gray-600 dark:text-gray-300">
					{mode === "edit" ? 'Update your profile information' : 'View your profile details'}
				</p>
			</div>

			<div className="flex flex-col items-center space-y-4">
				<div className="relative">
					<ImageCarousel images={[profilePicture]} />
					{mode === "edit" && (
						<div className="mt-4">
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
								Profile Picture URL
							</label>
							<Input
								type="text"
								value={profilePicture}
								onChange={(e) => setProfilePicture(e.target.value)}
								className="w-full"
								placeholder="Enter image URL"
							/>
						</div>
					)}
				</div>
			</div>

			{mode === "view" ? (
				<div className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
							<p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
							<p className="text-lg font-medium text-gray-900 dark:text-white">{email}</p>
						</div>
						<div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
							<p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
							<p className="text-lg font-medium text-gray-900 dark:text-white">{phoneNumber || 'Not provided'}</p>
						</div>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
							<p className="text-sm text-gray-500 dark:text-gray-400">First Name</p>
							<p className="text-lg font-medium text-gray-900 dark:text-white">{firstName}</p>
						</div>
						<div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
							<p className="text-sm text-gray-500 dark:text-gray-400">Last Name</p>
							<p className="text-lg font-medium text-gray-900 dark:text-white">{lastName}</p>
						</div>
					</div>
					<div className="flex justify-center">
						<Button
							onClick={() => {
								handleSubmit();
							}}
							className="px-6"
						>
							Edit Profile
						</Button>
					</div>
					<div className="flex justify-center">
						<LogoutButton />
					</div>
				</div>
			) : (
				<form onSubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}} className="space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
								Phone Number
							</label>
							<Input
								type="tel"
								value={phoneNumber}
								onChange={(e) => setPhoneNumber(e.target.value)}
								className="w-full"
							/>
						</div>
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
						<div className="md:col-span-2">
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
								Password
							</label>
							<Input
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="w-full"
								placeholder="Leave blank to keep current password"
							/>
						</div>
					</div>
					<div className="flex justify-center space-x-4 pt-4">
						<Button
							type="submit"
							onClick={() => {
								setDoUpdate(true);
								handleSubmit();
							}}
							className="px-6"
						>
							Save Changes
						</Button>
						<Button
							type="button"
							onClick={() => {
								setDoUpdate(false);
								handleSubmit();
							}}
							variant="outline"
							className="px-6"
						>
							Cancel
						</Button>
					</div>
				</form>
			)}

		</div>
	);
}

