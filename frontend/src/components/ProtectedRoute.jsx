import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Button from './ui/Button.jsx';

export default function ProtectedRoute({ adminOnly = false }) {
  const { isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (adminOnly && !isAdmin) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="mx-auto mb-4 inline-flex rounded-full bg-red-50 p-4 text-red-600">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-semibold text-stone-900">Staff only</h1>
        <p className="mt-2 text-sm text-stone-500">
          This area is for bakery staff. If you should have access, ask the owner to add your
          email to the admin list.
        </p>
        <Link to="/orders" className="mt-6 inline-block">
          <Button>Go to my orders</Button>
        </Link>
      </div>
    );
  }

  return <Outlet />;
}
