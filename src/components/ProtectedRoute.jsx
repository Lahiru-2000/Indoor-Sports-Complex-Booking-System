import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, user, adminOnly = false }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && (!user.role || user.role !== 'admin')) {
    return <Navigate to="/user/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
