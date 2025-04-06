import {
	LogOut
} from 'lucide-react';
async function logout() {
	try {
		const response = await fetch('/api/users/status', { method: 'DELETE', credentials: 'include' });
		if (!response.ok) throw new Error('Logout failed');

		localStorage.removeItem('user');

		// Redirect to login or home page
		window.location.href = '/';
	} catch (error) {
		console.error('Logout error:', error);
	}
}

interface LogoutButtonProps {
	className?: string;
	isRed?: boolean; // Accepts a boolean to toggle the color
}

export default function LogoutButton({ className, isRed = true }: LogoutButtonProps) {
	return (
		<button
			onClick={isRed ? logout : () => { }}

			className={`flex item-center justify-center space-x-2 px-2 py-2 rounded-lg shadow-md transition ${isRed ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-500 hover:bg-gray-600'} text-white ${className}`}
		>
			<LogOut size={15} />
			<span className="text-sm font-medium hidden sm:inline">Logout</span>
		</button>
	);
}

