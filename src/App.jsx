import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ComplexDetail from './pages/ComplexDetail';
import Booking from './pages/Booking';
import EquipmentShop from './pages/EquipmentShop';
import Restaurant from './pages/Restaurant';
import BrowseComplexes from './pages/BrowseComplexes';
import AboutUs from './pages/AboutUs';
import ContactUs from './pages/ContactUs';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage user={user} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/equipment-shop" element={<EquipmentShop />} />
        <Route path="/restaurant" element={<Restaurant />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/complex/:id" element={<ComplexDetail user={user} />} />
        <Route
          path="/user/dashboard"
          element={
            <ProtectedRoute user={user}>
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/browse-complexes"
          element={
            <ProtectedRoute user={user}>
              <BrowseComplexes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute user={user} adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/booking/:complexId"
          element={
            <ProtectedRoute user={user}>
              <Booking />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
