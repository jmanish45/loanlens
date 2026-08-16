import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../constants/routes';

export default function RoleRoute({ allowedRoles }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect based on their actual role
    if (user.role === 'officer') {
      return <Navigate to="/officer" replace />;
    }
    return <Navigate to={ROUTES.APPLICANT} replace />;
  }

  return <Outlet />;
}
