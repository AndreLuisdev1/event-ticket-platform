import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import AppLayout from '../layouts/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import ClientCatalogPage from '../pages/client/ClientCatalogPage';
import MyTicketsPage from '../pages/client/MyTickets';
import OrganizerCatalogPage from '../pages/organizer/OrganizerCatalogPage';
import ManageEventsPage from '../pages/organizer/ManageEventsPage';
import ValidateTicketsPage from '../pages/organizer/ValidadeTicketsPage';

function CatalogPage() {
	const { user } = useAuth();

	return user?.role === 'ORGANIZER' ? <OrganizerCatalogPage /> : <ClientCatalogPage />;
}

export function AppRouter() {
	return (
		<Routes>
			<Route path="/login" element={<LoginPage />} />
			<Route path="/register" element={<RegisterPage />} />
			<Route element={<ProtectedRoute />}>
				<Route element={<AppLayout />}>
					<Route path="/" element={<Navigate to="/catalog" replace />} />
					<Route path="/catalog" element={<CatalogPage />} />
					<Route path="/tickets" element={<MyTicketsPage />} />
					<Route path="/manage-events" element={<ManageEventsPage />} />
					<Route path="/validate-tickets" element={<ValidateTicketsPage />} />
				</Route>
			</Route>
			<Route path="*" element={<Navigate to="/" replace />} />
		</Routes>
	);
}
