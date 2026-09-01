import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { UserRole } from '@/types';
import { usePermission } from '@/hooks/usePermission';
import { refreshUser, logout } from '@/redux/slices/authSlice';
import { authService } from '@/services/api';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  permission?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  permission,
}) => {
  const { isAuthenticated, user, token } = useAppSelector((state) => state.auth);
  const { can, isSuperAdmin } = usePermission();
  const dispatch = useAppDispatch();
  const location = useLocation();

  const [sessionChecked, setSessionChecked] = useState(false);
  const hasFetched = useRef(false);

useEffect(() => {
    const storedToken = localStorage.getItem('medsseva_token');
    const expiry = localStorage.getItem('medsseva_token_expiry');

    if (expiry && Date.now() > Number(expiry)) {
      dispatch(logout());
      setSessionChecked(true);
      return;
    }

    if (!isAuthenticated || !storedToken || hasFetched.current) {
      setSessionChecked(true);
      return;
    }

    hasFetched.current = true;

    authService.getMe()
      .then((data) => {
        dispatch(refreshUser({ user: data.user }));
      })
      .catch(() => {
        dispatch(logout());
      })
      .finally(() => {
        setSessionChecked(true);
      });
  }, []);
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!sessionChecked) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (isSuperAdmin) return <>{children}</>;

  if (allowedRoles && !allowedRoles.includes(user.role as any)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (permission && !can(permission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};