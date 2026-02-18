import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/spinner';

interface PublicRouteProps {
  children: React.ReactNode;
}

export default function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1e3a5f] to-[#152a45]">
        <div className="text-center">
          <Spinner className="h-10 w-10 mx-auto mb-4 text-white" />
          <p className="text-white/70">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    // Redirect to the page they were trying to access, or dashboard
    const from = (location.state as any)?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
}
