// hooks/useUser.ts
import { useState, useEffect } from "react";

export interface User {
	email: string;
	password: string;
	firstName: string;
	lastName: string;
	phoneNumber: string;
	profilePicture?: string;
	role: "HOTEL_OWNER" | "REGULAR_USER"
}

export function useUser() {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// get profile info of curr user
		fetch('/api/users', { cache: "no-store", method: 'GET' })
			.then((res) => res.json())
			.then((data) => {
				if (data && data.user) {
					setUser(data.user); // If user data is available, set it
					localStorage.setItem('user', JSON.stringify(data.user));
				} else {
					setUser(null); // If no user data, ensure user is set to null
				}
			})
			.catch((error) => {
				console.error('Error fetching user:', error);
				setUser(null);
				setLoading(false);
			});
	}, []);

	return { user, setUser, loading };
}

