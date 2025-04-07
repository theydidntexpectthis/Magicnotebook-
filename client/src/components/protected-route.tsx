import React, { useEffect, useState } from 'react';
import { Route, useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ path, component: Component }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await apiRequest('GET', '/api/user');
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          setLocation('/auth');
        }
      } catch (error) {
        setIsAuthenticated(false);
        setLocation('/auth');
      }
    };

    checkAuth();
  }, [setLocation]);

  if (isAuthenticated === null) {
    // Loading state
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (isAuthenticated === false) {
    return null; // Route will redirect to /auth via the useEffect
  }

  return (
    <Route path={path}>
      <Component />
    </Route>
  );
};

export default ProtectedRoute;