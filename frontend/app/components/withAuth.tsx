"use client";
import { useRouter } from 'next/navigation';
import { useEffect, ComponentType } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface WithAuthProps {
  // You can add any props that your wrapped component might need
}

const withAuth = <P extends object>(
  WrappedComponent: ComponentType<P>,
  allowedRoles?: string[]
) => {
  const AuthComponent = (props: P & WithAuthProps) => {
    const { isAuthenticated, user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading) {
        if (!isAuthenticated) {
          router.replace('/login');
        } else if (allowedRoles && user && !allowedRoles.includes(user.role)) {
          // Redireciona para página de acesso negado
          router.replace('/acesso-negado');
        }
      }
    }, [isAuthenticated, user, isLoading, router, allowedRoles]);

    if (isLoading || !isAuthenticated || (allowedRoles && user && !allowedRoles.includes(user.role))) {
      // Render a loading state or null while checking auth or if access is denied
      // This prevents flashing the protected content
      return <div className="flex justify-center items-center min-h-screen">Verificando acesso...</div>;
    }

    return <WrappedComponent {...props} />;
  };
  AuthComponent.displayName = `WithAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  return AuthComponent;
};

export default withAuth;
