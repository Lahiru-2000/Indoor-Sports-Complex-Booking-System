import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useAuth } from '../hooks/useAuth';
import { useState, useRef, useEffect } from 'react';

const Header = ({ user: userProp }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: authUser } = useAuth();
  const user = userProp || authUser;
  const [showShopsDropdown, setShowShopsDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowShopsDropdown(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        const hamburgerButton = document.getElementById('mobile-menu-button');
        if (hamburgerButton && !hamburgerButton.contains(event.target)) {
          setMobileMenuOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 sm:space-x-3" onClick={() => setMobileMenuOpen(false)}>
            <img 
              src="/images/image.jpg" 
              alt="Prime Play Logo" 
              className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded-full"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <span className="text-xl sm:text-2xl font-bold text-gray-800">Prime Play</span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              to="/" 
              className={`text-gray-700 hover:text-primary transition ${
                isActive('/') ? 'border-b-2 border-primary' : ''
              }`}
            >
              Home
            </Link>
            <Link to="/about" className="text-gray-700 hover:text-primary transition">
              About
            </Link>
            
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowShopsDropdown(!showShopsDropdown)}
                className="text-gray-700 hover:text-primary transition flex items-center space-x-1"
              >
                <span>Shops</span>
                <svg 
                  className={`w-4 h-4 transition-transform ${showShopsDropdown ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showShopsDropdown && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <Link
                    to="/equipment-shop"
                    onClick={() => setShowShopsDropdown(false)}
                    className="block px-4 py-2 text-gray-700 hover:bg-primary hover:text-white transition"
                  >
                    Equipment Shop
                  </Link>
                  <Link
                    to="/restaurant"
                    onClick={() => setShowShopsDropdown(false)}
                    className="block px-4 py-2 text-gray-700 hover:bg-primary hover:text-white transition"
                  >
              Restaurant
            </Link>
                </div>
              )}
            </div>

           <Link to="/contact" className="text-gray-700 hover:text-primary transition">
              Contact Us
            </Link>
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            {user && location.pathname !== '/register' ? (
              <>
                {user.role === 'admin' ? (
                  <Link
                    to="/admin/dashboard"
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
                  >
                    Admin Dashboard
                  </Link>
                ) : (
                  <Link
                    to="/user/dashboard"
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
                  >
                    Dashboard
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-gray-700 hover:text-primary transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition flex items-center space-x-2"
              >
                <span>Login</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>

          <button
            id="mobile-menu-button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div
        ref={mobileMenuRef}
        className={`md:hidden absolute top-full left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-50 transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}
      >
        <nav className="container mx-auto px-4 py-4 space-y-3">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`block py-2 text-gray-700 hover:text-primary transition ${
              isActive('/') ? 'border-l-4 border-primary pl-3 text-primary' : 'pl-0'
            }`}
          >
            Home
          </Link>
          <Link
            to="/about"
            onClick={() => setMobileMenuOpen(false)}
            className={`block py-2 text-gray-700 hover:text-primary transition ${
              isActive('/about') ? 'border-l-4 border-primary pl-3 text-primary' : 'pl-0'
            }`}
          >
            About
          </Link>
          
                <Link
                  to="/equipment-shop"
            onClick={() => setMobileMenuOpen(false)}
            className={`block py-2 text-gray-700 hover:text-primary transition ${
              isActive('/equipment-shop') ? 'border-l-4 border-primary pl-3 text-primary' : 'pl-0'
            }`}
                >
                  Equipment Shop
                </Link>
                <Link
                  to="/restaurant"
            onClick={() => setMobileMenuOpen(false)}
            className={`block py-2 text-gray-700 hover:text-primary transition ${
              isActive('/restaurant') ? 'border-l-4 border-primary pl-3 text-primary' : 'pl-0'
            }`}
                >
                  Restaurant
                </Link>

          <Link
            to="/contact"
            onClick={() => setMobileMenuOpen(false)}
            className={`block py-2 text-gray-700 hover:text-primary transition ${
              isActive('/contact') ? 'border-l-4 border-primary pl-3 text-primary' : 'pl-0'
            }`}
          >
            Contact Us
          </Link>

          <div className="pt-4 border-t border-gray-200 space-y-3">
            {user && location.pathname !== '/register' ? (
              <>
                {user.role === 'admin' ? (
                  <Link
                    to="/admin/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
                  >
                    Admin Dashboard
                  </Link>
                ) : (
                  <Link
                    to="/user/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
                  >
                    Dashboard
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:text-primary transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center px-4 py-2 border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition"
              >
                Login
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
