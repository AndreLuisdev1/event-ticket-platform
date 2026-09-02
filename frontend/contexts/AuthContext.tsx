import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
const ACCESS_TOKEN_KEY = 'access_token';

export type UserRole = 'CLIENT' | 'ORGANIZER';

export interface User {
	id: number;
	name: string;
	email: string;
	role: UserRole;
}

interface LoginResponse {
	access_token: string;
	token_type: string;
	user: User;
}

interface RegisterData {
	name: string;
	email: string;
	password: string;
	role: UserRole;
}

interface AuthContextValue {
	user: User | null;
	isLoading: boolean;
	isAuthenticated: boolean;
	login: (email: string, password: string) => Promise<void>;
	register: (data: RegisterData) => Promise<User>;
	logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function getErrorMessage(response: Response, fallback: string): Promise<string> {
	const body = await response.json().catch(() => null);
	return body?.detail ?? fallback;
}

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const token = localStorage.getItem(ACCESS_TOKEN_KEY);
		if (!token) {
			setIsLoading(false);
			return;
		}

		void fetch(`${API_URL}/auth/me`, {
			headers: { Authorization: `Bearer ${token}` },
		})
			.then(async (response) => {
				if (!response.ok) {
					localStorage.removeItem(ACCESS_TOKEN_KEY);
					return;
				}
				setUser(await response.json() as User);
			})
			.catch(() => {
				localStorage.removeItem(ACCESS_TOKEN_KEY);
			})
			.finally(() => setIsLoading(false));
	}, []);

	async function login(email: string, password: string) {
		const response = await fetch(`${API_URL}/auth/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, password }),
		});
		if (!response.ok) throw new Error(await getErrorMessage(response, 'Não foi possível entrar.'));

		const data = await response.json() as LoginResponse;
		localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
		setUser(data.user);
	}

	async function register(data: RegisterData) {
		const response = await fetch(`${API_URL}/auth/register`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
		});
		if (!response.ok) throw new Error(await getErrorMessage(response, 'Não foi possível criar sua conta.'));
		return await response.json() as User;
	}

	function logout() {
		localStorage.removeItem(ACCESS_TOKEN_KEY);
		setUser(null);
	}

	return <AuthContext.Provider value={{ user, isLoading, isAuthenticated: user !== null, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
	return context;
}

export function getAccessToken() {
	return localStorage.getItem(ACCESS_TOKEN_KEY);
}
