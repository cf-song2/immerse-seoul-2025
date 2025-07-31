import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function AuthGuard({ children, fallback }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin h-12 w-12 text-purple-600" />
      </div>
    );
  }

  if (!user) {
    return fallback || <div>Please login to continue</div>;
  }

  return children;
}