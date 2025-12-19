import { useAuth } from '../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient">
        <div className="text-white text-3xl font-bold">Loading...</div>
      </div>
    );
  }

  // If user exists → show protected pages
  // If not → redirect to login
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}