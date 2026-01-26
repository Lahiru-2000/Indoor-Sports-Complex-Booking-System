import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db, auth } from '../firebase/config';
import { useAuth } from '../hooks/useAuth';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Swal from 'sweetalert2';

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [bookingTab, setBookingTab] = useState('court'); // 'court', 'restaurant', or 'equipment'
  const [bookings, setBookings] = useState([]);
  const [restaurantPurchases, setRestaurantPurchases] = useState([]);
  const [equipmentPurchases, setEquipmentPurchases] = useState([]);
  const [packagePurchases, setPackagePurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPayments, setTotalPayments] = useState(0);
  const [openMenuId, setOpenMenuId] = useState(null); // Track which booking menu is open
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [currentPage, setCurrentPage] = useState(1); // Pagination state for bookings
  const [invoicePage, setInvoicePage] = useState(1); // Pagination state for invoices
  const itemsPerPage = 10; // Number of bookings per page
  const invoicesPerPage = 10; // Number of invoices per page
  const [profileData, setProfileData] = useState({
    name: '',
    phone: ''
  });
  const [userProfileData, setUserProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  if (user && user.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserProfileData(userData);
          }
        } catch (error) {
          console.error('Error fetching user package:', error);
        }

        const q = query(
          collection(db, 'bookings'), 
          where('userId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        const bookingsData = await Promise.all(
          querySnapshot.docs.map(async (docSnap) => {
            const bookingData = { id: docSnap.id, ...docSnap.data() };
            if (bookingData.complexId) {
              try {
                const complexDoc = await getDoc(doc(db, 'complexes', bookingData.complexId));
                if (complexDoc.exists()) {
                  bookingData.complex = { id: complexDoc.id, ...complexDoc.data() };
                }
              } catch (error) {
                console.error('Error fetching complex:', error);
              }
            }
            if (bookingData.coachId) {
              try {
                const coachDoc = await getDoc(doc(db, 'coaches', bookingData.coachId));
                if (coachDoc.exists()) {
                  bookingData.coach = { id: coachDoc.id, ...coachDoc.data() };
                }
              } catch (error) {
                console.error('Error fetching coach:', error);
              }
            }
            return bookingData;
          })
        );
        
        const sortedBookings = bookingsData.sort((a, b) => {
          const aTime = a.updatedAt?.toDate?.()?.getTime() || a.createdAt?.toDate?.()?.getTime() || a.createdAt || 0;
          const bTime = b.updatedAt?.toDate?.()?.getTime() || b.createdAt?.toDate?.()?.getTime() || b.createdAt || 0;
          return bTime - aTime;
        });
        
        setBookings(sortedBookings);

        try {
          const restaurantQuery = query(
            collection(db, 'restaurantPurchases'),
            where('userId', '==', user.uid)
          );
          const restaurantSnapshot = await getDocs(restaurantQuery);
          const restaurantData = restaurantSnapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
          })).sort((a, b) => {
            const aTime = a.createdAt?.toDate?.()?.getTime() || a.createdAt || 0;
            const bTime = b.createdAt?.toDate?.()?.getTime() || b.createdAt || 0;
            return bTime - aTime;
          });
          setRestaurantPurchases(restaurantData);
        } catch (error) {
          console.error('Error fetching restaurant purchases:', error);
        }

        try {
          const equipmentQuery = query(
            collection(db, 'equipmentPurchases'),
            where('userId', '==', user.uid)
          );
          const equipmentSnapshot = await getDocs(equipmentQuery);
          const equipmentData = equipmentSnapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
          })).sort((a, b) => {
            const aTime = a.createdAt?.toDate?.()?.getTime() || a.createdAt || 0;
            const bTime = b.createdAt?.toDate?.()?.getTime() || b.createdAt || 0;
            return bTime - aTime;
          });
          setEquipmentPurchases(equipmentData);
        } catch (error) {
          console.error('Error fetching equipment purchases:', error);
        }

        try {
          const packageQuery = query(
            collection(db, 'packagePurchases'),
            where('email', '==', user.email)
          );
          const packageSnapshot = await getDocs(packageQuery);
          const packageData = packageSnapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
          })).sort((a, b) => {
            const aTime = a.createdAt?.toDate?.()?.getTime() || a.createdAt || 0;
            const bTime = b.createdAt?.toDate?.()?.getTime() || b.createdAt || 0;
            return bTime - aTime;
          });
          setPackagePurchases(packageData);
        } catch (error) {
          console.error('Error fetching package purchases:', error);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        Swal.fire({
          icon: 'error',
          title: 'Loading Error',
          text: 'Error loading bookings. Please refresh the page.',
          confirmButtonColor: '#10b981'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    const bookingsTotal = bookings.reduce((sum, booking) => sum + (booking.total || 0), 0);
    const restaurantTotal = restaurantPurchases.reduce((sum, purchase) => sum + (purchase.total || 0), 0);
    const equipmentTotal = equipmentPurchases.reduce((sum, purchase) => sum + (purchase.total || 0), 0);
    const packageTotal = packagePurchases.reduce((sum, purchase) => sum + (purchase.amount || 0), 0);
    const totalPayments = bookingsTotal + restaurantTotal + equipmentTotal + packageTotal;
    setTotalPayments(totalPayments);
  }, [bookings, restaurantPurchases, equipmentPurchases, packagePurchases]);

  const getTodaysAppointments = () => {
    const today = new Date().toISOString().split('T')[0];
    return bookings.filter(booking => {
      const bookingDate = booking.date?.toDate?.()?.toISOString().split('T')[0] || booking.date;
      return bookingDate === today && booking.status !== 'cancelled';
    });
  };

  const getComplexPriceWithDiscount = (booking) => {
    const pricePerHour = booking.complex?.pricePerHour || 50;
    const hours = booking.hours || 1;
    let courtTotal = pricePerHour * hours;
    
    const userPackage = userProfileData?.package || 'normal';
    if (userPackage && userPackage !== 'normal') {
      const discountPercent = userPackage === 'package2' ? 2 : userPackage === 'package3' ? 5 : 0;
      if (discountPercent > 0) {
        const discount = (courtTotal * discountPercent) / 100;
        courtTotal = courtTotal - discount;
      }
    }
    
    let total = courtTotal;
    if (booking.coachRequired && booking.coachId && booking.coach) {
      const coachPrice = booking.coach.price || 30;
      total += coachPrice * hours;
    }
    
    return total;
  };

  const totalCourtBooked = bookings.filter(b => b.status !== 'cancelled').length;
  const totalRestaurantOrders = restaurantPurchases.length;
  const totalEquipmentOrders = equipmentPurchases.length;
  const todaysAppointments = getTodaysAppointments();

  const courtBookings = bookings;

  useEffect(() => {
    setCurrentPage(1);
  }, [bookingTab]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (activeTab === 'profile' && user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserProfileData(userData);
            setProfileData({
              name: userData.name || user?.displayName || '',
              phone: userData.phone || ''
            });
          } else {
            setProfileData({
              name: user?.displayName || '',
              phone: ''
            });
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setProfileError('Failed to load profile data');
        }
      }
    };

    fetchUserProfile();
  }, [activeTab, user]);

  const getCurrentBookingData = () => {
    if (bookingTab === 'court') return courtBookings;
    if (bookingTab === 'restaurant') return restaurantPurchases;
    return equipmentPurchases;
  };

  const currentBookingData = getCurrentBookingData();
  const totalPages = Math.ceil(currentBookingData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBookings = currentBookingData.slice(startIndex, endIndex);

  const formatDate = (date) => {
    if (!date) return 'N/A';
    let dateObj;
    if (date.toDate) {
      dateObj = date.toDate();
    } else {
      dateObj = new Date(date);
    }
    return dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatDateTime = (date, timeSlot) => {
    if (!date || !timeSlot) return 'N/A';
    let dateObj;
    if (date.toDate) {
      dateObj = date.toDate();
    } else {
      dateObj = new Date(date);
    }
    
    const day = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
    const dayNum = dateObj.getDate();
    
    const parts = timeSlot.split(' - ');
    if (parts.length === 2) {
      const startTime = convertTo12Hour(parts[0].trim());
      const endTime = convertTo12Hour(parts[1].trim());
      return `${day}, ${month} ${dayNum}, ${startTime} - ${endTime}`;
    }
    return `${day}, ${month} ${dayNum}, ${timeSlot}`;
  };

  const convertTo12Hour = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes || '00'} ${ampm}`;
  };

  const formatTime = (timeSlot) => {
    if (!timeSlot) return 'N/A';
    const parts = timeSlot.split(' - ');
    if (parts.length === 2) {
      return `${convertTo12Hour(parts[0].trim())} - ${convertTo12Hour(parts[1].trim())}`;
    }
    return timeSlot;
  };

  const handleProfileUpdate = async () => {
    if (!user) return;

    setProfileLoading(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name: profileData.name,
        phone: profileData.phone
      });

      if (auth.currentUser) {
        try {
          await updateProfile(auth.currentUser, {
            displayName: profileData.name
          });
        } catch (authError) {
          console.warn('Failed to update auth displayName:', authError);
        }
      }

      setProfileSuccess('Profile updated successfully!');
      setUserProfileData({ ...userProfileData, name: profileData.name, phone: profileData.phone });
      
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setProfileError('Failed to update profile. Please try again.');
    } finally {
      setProfileLoading(false);
    }
  };

  const getCourtNumber = (booking) => {
  
    if (booking.complexId) {
      const courtNum = (parseInt(booking.complexId.slice(-1)) || 1) % 5 + 1;
      return `Court ${courtNum}`;
    }
    return 'Court 1';
  };

  const getGuests = (booking) => {
    return booking.guests || 1;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header user={user} />
      
      <div className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        <div className="max-w-7xl mx-auto">
          
          <div className="bg-white rounded-lg shadow-sm p-1.5 sm:p-2 mb-4 sm:mb-6 flex flex-wrap gap-1.5 sm:gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg text-xs sm:text-sm md:text-base font-semibold transition flex items-center gap-1.5 sm:gap-2 ${
                activeTab === 'dashboard'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg text-xs sm:text-sm md:text-base font-semibold transition flex items-center gap-1.5 sm:gap-2 ${
                activeTab === 'bookings'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="hidden sm:inline">My Bookings</span>
              <span className="sm:hidden">Bookings</span>
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg text-xs sm:text-sm md:text-base font-semibold transition flex items-center gap-1.5 sm:gap-2 ${
                activeTab === 'invoices'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Invoices
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg text-xs sm:text-sm md:text-base font-semibold transition flex items-center gap-1.5 sm:gap-2 ${
                activeTab === 'profile'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="hidden sm:inline">Profile Setting</span>
              <span className="sm:hidden">Profile</span>
            </button>
          </div>

          {/* Dashboard Tab Content */}
          {activeTab === 'dashboard' && (
            <>
              {/* Statistics Section */}
              <div className="mb-6 sm:mb-8">
                <div className="mb-4">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Statistics</h2>
                  <p className="text-sm sm:text-base text-gray-600 mt-1">Boost your game with stats and goals tailored to you.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 hover:shadow-xl transition">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-gray-600 text-xs sm:text-sm mb-1">Total Court Booked</h3>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-800">{totalCourtBooked}</p>
                  </div>

                  <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 hover:shadow-xl transition">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-gray-600 text-xs sm:text-sm mb-1">Restaurant Orders</h3>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-800">{totalRestaurantOrders}</p>
                  </div>

                  <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 hover:shadow-xl transition">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-gray-600 text-xs sm:text-sm mb-1">Equipment Orders</h3>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-800">{totalEquipmentOrders}</p>
                  </div>

                  <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 hover:shadow-xl transition">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-gray-600 text-xs sm:text-sm mb-1">Total Payments</h3>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-800">£{totalPayments.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Today's Appointment */}
              <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
                <div className="mb-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Today's Appointment</h2>
                  <p className="text-gray-600 text-xs sm:text-sm mt-1">Your Personal Sports Schedule</p>
                </div>
                {loading ? (
                  <div className="text-center py-8 text-gray-500">Loading appointments...</div>
                ) : todaysAppointments.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-600">No appointments scheduled for today</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {todaysAppointments.map((appointment) => (
                      <div key={appointment.id} className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-gray-800 text-sm sm:text-base truncate">{appointment.complex?.name || 'Sports Complex'}</h3>
                              <p className="text-xs sm:text-sm text-gray-600">{appointment.sport}</p>
                            </div>
                          </div>
                          <div className="text-left sm:text-right w-full sm:w-auto pl-0 sm:pl-0">
                            <p className="text-xs sm:text-sm font-semibold text-gray-800">{formatDate(appointment.date)}</p>
                            <p className="text-xs sm:text-sm text-gray-600">{formatTime(appointment.timeSlot)}</p>
                            <span className={`inline-block mt-1 sm:mt-2 px-2 py-1 rounded text-xs ${
                              appointment.status === 'confirmed' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {appointment.status || 'pending'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* My Bookings Preview */}
              <div className="mt-4 sm:mt-6 bg-white rounded-lg shadow-lg p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800">My Bookings</h2>
                    <p className="text-gray-600 text-xs sm:text-sm mt-1">Court Reservations Made Easy</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('bookings')}
                    className="text-primary hover:text-primary-dark font-semibold text-sm sm:text-base"
                  >
                    View All →
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    onClick={() => setBookingTab('court')}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition ${
                      bookingTab === 'court'
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Court
                  </button>
                  <button
                    onClick={() => setBookingTab('restaurant')}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition ${
                      bookingTab === 'restaurant'
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Restaurant
                  </button>
                  <button
                    onClick={() => setBookingTab('equipment')}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition ${
                      bookingTab === 'equipment'
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Sport Equipment
                  </button>
                </div>
                {loading ? (
                  <div className="text-center py-8 text-gray-500">Loading bookings...</div>
                ) : (bookingTab === 'court' ? courtBookings : bookingTab === 'restaurant' ? restaurantPurchases : equipmentPurchases).length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">
                      {bookingTab === 'court' ? 'No court bookings yet.' : bookingTab === 'restaurant' ? 'No restaurant orders yet.' : 'No equipment orders yet.'}
                    </p>
                    {bookingTab === 'court' ? (
            <button
              onClick={() => navigate('/browse-complexes')}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
            >
              Browse Complexes
            </button>
                    ) : bookingTab === 'restaurant' ? (
                      <button
                        onClick={() => navigate('/restaurant')}
                        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
                      >
                        Visit Restaurant
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate('/equipment-shop')}
                        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
                      >
                        Visit Equipment Shop
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(bookingTab === 'court' ? courtBookings : bookingTab === 'restaurant' ? restaurantPurchases : equipmentPurchases).slice(0, 3).map((item) => {
                      if (bookingTab === 'court') {
                        const booking = item;
                        return (
                      <div key={booking.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition">
                        <div className="flex">
                          {/* Image Thumbnail */}
                          <div className="w-24 h-24 flex-shrink-0">
                            <img
                              src={booking.complex?.image || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400'}
                              alt={booking.complex?.name || 'Sports Complex'}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400';
                              }}
                            />
          </div>

                            {/* Booking Details */}
                            <div className="flex-1 p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-800 mb-1 text-sm sm:text-base truncate">
                                  {booking.complex?.name || 'Sports Complex'}
                                </h3>
                                <p className="text-xs text-gray-600 mb-1">{getCourtNumber(booking)}</p>
                                <p className="text-xs text-gray-600">
                                  {getGuests(booking)} Guests • {booking.hours || 1} {booking.hours === 1 ? 'Hr' : 'Hrs'}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                  {formatDateTime(booking.date, booking.timeSlot)}
                                </p>
                              </div>
                              <div className="text-left sm:text-right w-full sm:w-auto flex items-center justify-between sm:block">
                                <p className="text-base sm:text-lg font-bold text-primary">£{getComplexPriceWithDiscount(booking).toFixed(2)}</p>
                              <span className={`inline-block mt-1 px-2 py-1 rounded text-xs ${
                                booking.status === 'confirmed' 
                                  ? 'bg-green-100 text-green-800' 
                                  : booking.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {booking.status || 'pending'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                      } else if (bookingTab === 'restaurant') {
                        const purchase = item;
                        return (
                          <div key={purchase.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition">
                            <div className="flex flex-col sm:flex-row">
                              <div className="w-full h-32 sm:w-24 sm:h-24 flex-shrink-0 bg-primary/10 flex items-center justify-center">
                                <svg className="w-10 h-10 sm:w-12 sm:h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                              </div>
                              <div className="flex-1 p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-bold text-gray-800 mb-1 text-sm sm:text-base">Restaurant Order</h3>
                                  <p className="text-xs text-gray-600">
                                    {purchase.items?.length || 0} item{purchase.items?.length !== 1 ? 's' : ''}
                                  </p>
                                  <p className="text-xs text-gray-600 mt-1">
                                    {purchase.createdAt?.toDate ? formatDate(purchase.createdAt) : 'N/A'}
                                  </p>
                                </div>
                                <div className="text-right ml-4">
                                  <p className="text-lg font-bold text-primary">£{purchase.total?.toFixed(2) || '0.00'}</p>
                                  <span className={`inline-block mt-1 px-2 py-1 rounded text-xs ${
                                    purchase.status === 'confirmed' 
                                      ? 'bg-green-100 text-green-800' 
                                      : purchase.status === 'pending'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {purchase.status || 'pending'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      } else {
                        const purchase = item;
                        return (
                          <div key={purchase.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition">
                            <div className="flex flex-col sm:flex-row">
                              <div className="w-full h-32 sm:w-24 sm:h-24 flex-shrink-0 bg-primary/10 flex items-center justify-center">
                                <svg className="w-10 h-10 sm:w-12 sm:h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                              </div>
                              <div className="flex-1 p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-bold text-gray-800 mb-1 text-sm sm:text-base">Equipment Order</h3>
                                  <p className="text-xs text-gray-600">
                                    {purchase.items?.length || 0} item{purchase.items?.length !== 1 ? 's' : ''}
                                  </p>
                                  <p className="text-xs text-gray-600 mt-1">
                                    {purchase.createdAt?.toDate ? formatDate(purchase.createdAt) : 'N/A'}
                                  </p>
                                </div>
                                <div className="text-right ml-4">
                                  <p className="text-lg font-bold text-primary">£{purchase.total?.toFixed(2) || '0.00'}</p>
                                  <span className={`inline-block mt-1 px-2 py-1 rounded text-xs ${
                                    purchase.status === 'confirmed' 
                                      ? 'bg-green-100 text-green-800' 
                                      : purchase.status === 'pending'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {purchase.status || 'pending'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* My Bookings Tab Content */}
          {activeTab === 'bookings' && (
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800">My Bookings</h2>
                  <p className="text-gray-600 text-xs sm:text-sm mt-1">Court Reservations Made Easy</p>
                </div>
                <button
                  onClick={() => navigate('/browse-complexes')}
                  className="px-4 sm:px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition text-sm sm:text-base"
                >
                  Book New
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
                <button
                  onClick={() => setBookingTab('court')}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition ${
                    bookingTab === 'court'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Court
                </button>
                <button
                  onClick={() => setBookingTab('restaurant')}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition ${
                    bookingTab === 'restaurant'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Restaurant
                </button>
                <button
                  onClick={() => setBookingTab('equipment')}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition ${
                    bookingTab === 'equipment'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Sport Equipment
                </button>
              </div>
              {loading ? (
                <div className="text-center py-12 text-gray-500">Loading...</div>
              ) : (bookingTab === 'court' ? courtBookings : bookingTab === 'restaurant' ? restaurantPurchases : equipmentPurchases).length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 mb-4">
                    {bookingTab === 'court' ? 'No court bookings yet.' : bookingTab === 'restaurant' ? 'No restaurant orders yet.' : 'No equipment orders yet.'}
                  </p>
                  {bookingTab === 'court' ? (
                    <button
                      onClick={() => navigate('/browse-complexes')}
                      className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
                    >
                      Browse Complexes
                    </button>
                  ) : bookingTab === 'restaurant' ? (
                    <button
                      onClick={() => navigate('/restaurant')}
                      className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
                    >
                      Visit Restaurant
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate('/equipment-shop')}
                      className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
                    >
                      Visit Equipment Shop
                    </button>
                  )}
              </div>
            ) : (
                <>
              <div className="space-y-4">
                    {paginatedBookings.map((item) => {
                    if (bookingTab === 'court') {
                      const booking = item;
                      return (
                        <div key={booking.id} className="bg-white border border-gray-200 rounded-lg hover:shadow-lg transition relative">
                          <div className="flex flex-col sm:flex-row">
                            {/* Image Thumbnail */}
                            <div className="w-full h-40 sm:w-32 sm:h-32 flex-shrink-0 overflow-hidden rounded-tl-lg rounded-bl-lg">
                              <img
                                src={booking.complex?.image || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400'}
                                alt={booking.complex?.name || 'Sports Complex'}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400';
                                }}
                              />
                            </div>
                            
                            {/* Booking Details */}
                            <div className="flex-1 p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                              <div className="flex-1 min-w-0">
                                {/* Academy/Complex Name */}
                                <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-1 truncate">
                          {booking.complex?.name || 'Sports Complex'}
                        </h3>
                                
                                {/* Court Number */}
                                <p className="text-xs sm:text-sm text-gray-600 mb-2">
                                  {getCourtNumber(booking)}
                                </p>
                                
                                {/* Guests and Duration */}
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-4 mb-2">
                                  <span className="text-xs sm:text-sm text-gray-600">
                                    <span className="font-semibold">Guests:</span> {getGuests(booking)}
                                  </span>
                                  <span className="text-xs sm:text-sm text-gray-600">
                                    <span className="font-semibold">Duration:</span> {booking.hours || 1} {booking.hours === 1 ? 'Hr' : 'Hrs'}
                                  </span>
                                </div>
                                
                                {/* Date & Time */}
                                <p className="text-xs sm:text-sm text-gray-600">
                                  {formatDateTime(booking.date, booking.timeSlot)}
                                </p>
                              </div>
                              
                              {/* Price and Menu */}
                              <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto">
                                {/* Price */}
                                <div className="text-left sm:text-right">
                                  <p className="text-lg sm:text-xl font-bold text-primary">
                                    £{getComplexPriceWithDiscount(booking).toFixed(2)}
                                  </p>
                                  <span className={`inline-block mt-1 px-2 py-1 rounded text-xs ${
                            booking.status === 'confirmed' 
                              ? 'bg-green-100 text-green-800' 
                              : booking.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {booking.status || 'pending'}
                          </span>
                                </div>
                                
                                {/* Three-dot Menu with Dropdown */}
                                <div className="relative z-50">
                                  <button
                                    className="p-2 hover:bg-gray-100 rounded-full transition"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenuId(openMenuId === booking.id ? null : booking.id);
                                    }}
                                  >
                                    <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                                    </svg>
                                  </button>
                                  
                                  {openMenuId === booking.id && (
                                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-[100] py-1">
                                      <button
                                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition flex items-center gap-2"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedBooking(booking);
                                          setShowViewModal(true);
                                          setOpenMenuId(null);
                                        }}
                                      >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                                        </svg>
                                        View Details
                                      </button>
                                      {booking.status === 'pending' && (
                                        <button
                                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition flex items-center gap-2"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/booking/${booking.complexId}?edit=${booking.id}`);
                                            setOpenMenuId(null);
                                          }}
                                        >
                                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                                          </svg>
                                          Edit Booking
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    } else if (bookingTab === 'restaurant') {
                      const purchase = item;
                      return (
                        <div key={purchase.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition">
                          <div className="flex">
                            <div className="w-32 h-32 flex-shrink-0 bg-primary/10 flex items-center justify-center">
                              <svg className="w-16 h-16 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                            </div>
                            <div className="flex-1 p-4 flex justify-between items-center">
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-800 mb-2">Restaurant Order</h3>
                                <p className="text-sm text-gray-600 mb-2">
                                  {purchase.items?.length || 0} item{purchase.items?.length !== 1 ? 's' : ''}
                                </p>
                                {purchase.items && purchase.items.length > 0 && (
                                  <div className="text-sm text-gray-600">
                                    {purchase.items.slice(0, 3).map((item, idx) => (
                                      <span key={idx}>
                                        {item.name} x{item.quantity}
                                        {idx < Math.min(2, purchase.items.length - 1) && ', '}
                                      </span>
                                    ))}
                                    {purchase.items.length > 3 && ` +${purchase.items.length - 3} more`}
                                  </div>
                                )}
                                <p className="text-sm text-gray-600 mt-2">
                                  {purchase.createdAt?.toDate ? formatDate(purchase.createdAt) : 'N/A'}
                                </p>
                              </div>
                              <div className="text-right ml-4">
                                <p className="text-xl font-bold text-primary">£{purchase.total?.toFixed(2) || '0.00'}</p>
                                <span className={`inline-block mt-1 px-2 py-1 rounded text-xs ${
                                  purchase.status === 'confirmed' 
                                    ? 'bg-green-100 text-green-800' 
                                    : purchase.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {purchase.status || 'pending'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    } else {
                      const purchase = item;
                      return (
                        <div key={purchase.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition">
                          <div className="flex">
                            <div className="w-32 h-32 flex-shrink-0 bg-primary/10 flex items-center justify-center">
                              <svg className="w-16 h-16 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                            </div>
                            <div className="flex-1 p-4 flex justify-between items-center">
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-800 mb-2">Equipment Order</h3>
                                <p className="text-sm text-gray-600 mb-2">
                                  {purchase.items?.length || 0} item{purchase.items?.length !== 1 ? 's' : ''}
                                </p>
                                {purchase.items && purchase.items.length > 0 && (
                                  <div className="text-sm text-gray-600">
                                    {purchase.items.slice(0, 3).map((item, idx) => (
                                      <span key={idx}>
                                        {item.name} x{item.quantity}
                                        {idx < Math.min(2, purchase.items.length - 1) && ', '}
                                      </span>
                                    ))}
                                    {purchase.items.length > 3 && ` +${purchase.items.length - 3} more`}
                                  </div>
                                )}
                                <p className="text-sm text-gray-600 mt-2">
                                  {purchase.createdAt?.toDate ? formatDate(purchase.createdAt) : 'N/A'}
                                </p>
                              </div>
                              <div className="text-right ml-4">
                                <p className="text-xl font-bold text-primary">£{purchase.total?.toFixed(2) || '0.00'}</p>
                                <span className={`inline-block mt-1 px-2 py-1 rounded text-xs ${
                                  purchase.status === 'confirmed' 
                                    ? 'bg-green-100 text-green-800' 
                                    : purchase.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {purchase.status || 'pending'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })}
                  </div>
                  
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                      <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                        Showing {startIndex + 1} to {Math.min(endIndex, currentBookingData.length)} of {currentBookingData.length} bookings
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-semibold transition text-sm sm:text-base ${
                            currentPage === 1
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-primary text-white hover:bg-primary-dark'
                          }`}
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-semibold transition text-sm sm:text-base ${
                            currentPage === totalPages
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-primary text-white hover:bg-primary-dark'
                          }`}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Invoices Tab Content */}
          {activeTab === 'invoices' && (() => {
            // Combine all payment types into unified invoice list
            const allInvoices = [
              // For bookings, use updatedAt if exists, otherwise createdAt
              ...bookings.map(b => ({ 
                ...b, 
                type: 'booking', 
                invoiceDate: b.updatedAt || b.createdAt || b.date,
                originalDate: b.createdAt || b.date,
                updatedDate: b.updatedAt || null
              })),
              ...restaurantPurchases.map(p => ({ ...p, type: 'restaurant', invoiceDate: p.createdAt })),
              ...equipmentPurchases.map(p => ({ ...p, type: 'equipment', invoiceDate: p.createdAt })),
              ...packagePurchases.map(p => ({ ...p, type: 'package', invoiceDate: p.createdAt }))
            ].sort((a, b) => {
              const aTime = a.invoiceDate?.toDate?.()?.getTime() || a.invoiceDate || 0;
              const bTime = b.invoiceDate?.toDate?.()?.getTime() || b.invoiceDate || 0;
              return bTime - aTime; // Newest first
            });

            const totalInvoices = allInvoices.length;
            const totalInvoicePages = Math.ceil(totalInvoices / invoicesPerPage);
            const startIndex = (invoicePage - 1) * invoicesPerPage;
            const endIndex = startIndex + invoicesPerPage;
            const paginatedInvoices = allInvoices.slice(startIndex, endIndex);

            return (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Invoices</h2>
                {loading ? (
                  <div className="text-center py-12 text-gray-500">Loading invoices...</div>
                ) : totalInvoices === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600 mb-4">No invoices available.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 mb-6">
                      {paginatedInvoices.map((invoice) => {
                        if (invoice.type === 'booking') {
                          return (
                            <div key={invoice.id} className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition">
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-3 sm:gap-0 mb-4">
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-2">
                                    Invoice #{invoice.id.slice(0, 8).toUpperCase()}
                                  </h3>
                                  <p className="text-xs sm:text-sm text-gray-500 mb-1">Type: Court Booking</p>
                                </div>
                                <div className="text-left sm:text-right w-full sm:w-auto">
                                  <p className="text-xl sm:text-2xl font-bold text-primary mb-2">£{getComplexPriceWithDiscount(invoice).toFixed(2)}</p>
                                  <span className={`inline-block px-3 py-1 rounded text-sm ${
                                    invoice.status === 'confirmed' 
                                      ? 'bg-green-100 text-green-800' 
                                      : invoice.status === 'pending'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {invoice.status || 'pending'}
                                  </span>
                                </div>
                              </div>
                              <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                                <div>
                                  <p className="text-sm text-gray-600 mb-1">Complex</p>
                                  <p className="text-gray-800 font-semibold">{invoice.complex?.name || 'Sports Complex'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600 mb-1">Sport</p>
                                  <p className="text-gray-800 font-semibold capitalize">{invoice.sport || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600 mb-1">Booking Date</p>
                                  <p className="text-gray-800 font-semibold">{formatDate(invoice.date)}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600 mb-1">Time Slot</p>
                                  <p className="text-gray-800 font-semibold">{formatTime(invoice.timeSlot)}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600 mb-1">Duration</p>
                                  <p className="text-gray-800 font-semibold">{invoice.hours || 1} {invoice.hours === 1 ? 'Hour' : 'Hours'}</p>
                                </div>
                                {invoice.coachRequired && (
                                  <div>
                                    <p className="text-sm text-gray-600 mb-1">Coach</p>
                                    <p className="text-gray-800 font-semibold">Included</p>
                                  </div>
                                )}
                                <div>
                                  <p className="text-sm text-gray-600 mb-1">Invoice Date</p>
                                  <p className="text-gray-800 font-semibold">{invoice.originalDate?.toDate ? formatDate(invoice.originalDate) : invoice.createdAt?.toDate ? formatDate(invoice.createdAt) : 'N/A'}</p>
                                </div>
                                {invoice.updatedDate && (
                                  <div>
                                    <p className="text-sm text-gray-600 mb-1">Last Updated</p>
                                    <p className="text-gray-800 font-semibold">{invoice.updatedDate?.toDate ? formatDate(invoice.updatedDate) : 'N/A'}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        } else if (invoice.type === 'restaurant') {
                          return (
                            <div key={invoice.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                                    Invoice #{invoice.id.slice(0, 8).toUpperCase()}
                                  </h3>
                                  <p className="text-sm text-gray-500 mb-1">Type: Restaurant Order</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-2xl font-bold text-primary mb-2">£{invoice.total?.toFixed(2) || '0.00'}</p>
                                  <span className={`inline-block px-3 py-1 rounded text-sm ${
                                    invoice.status === 'confirmed' 
                                      ? 'bg-green-100 text-green-800' 
                                      : invoice.status === 'pending'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {invoice.status || 'pending'}
                                  </span>
                                </div>
                              </div>
                              <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                                <div>
                                  <p className="text-sm text-gray-600 mb-1">Items</p>
                                  <p className="text-gray-800 font-semibold">{invoice.items?.length || 0} item{invoice.items?.length !== 1 ? 's' : ''}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600 mb-1">Invoice Date</p>
                                  <p className="text-gray-800 font-semibold">{invoice.createdAt?.toDate ? formatDate(invoice.createdAt) : 'N/A'}</p>
                                </div>
                                {invoice.items && invoice.items.length > 0 && (
                                  <div className="md:col-span-2">
                                    <p className="text-sm text-gray-600 mb-2">Order Details</p>
                                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                                      {invoice.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                          <span className="text-gray-700">{item.name || item.itemName} x{item.quantity || 1}</span>
                                          <span className="text-gray-800 font-semibold">£{((item.price || 0) * (item.quantity || 1)).toFixed(2)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        } else if (invoice.type === 'equipment') {
                          return (
                            <div key={invoice.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                                    Invoice #{invoice.id.slice(0, 8).toUpperCase()}
                                  </h3>
                                  <p className="text-sm text-gray-500 mb-1">Type: Equipment Purchase</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-2xl font-bold text-primary mb-2">£{invoice.total?.toFixed(2) || '0.00'}</p>
                                  <span className={`inline-block px-3 py-1 rounded text-sm ${
                                    invoice.status === 'confirmed' 
                                      ? 'bg-green-100 text-green-800' 
                                      : invoice.status === 'pending'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {invoice.status || 'pending'}
                                  </span>
                                </div>
                              </div>
                              <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                                <div>
                                  <p className="text-sm text-gray-600 mb-1">Items</p>
                                  <p className="text-gray-800 font-semibold">{invoice.items?.length || 0} item{invoice.items?.length !== 1 ? 's' : ''}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600 mb-1">Invoice Date</p>
                                  <p className="text-gray-800 font-semibold">{invoice.createdAt?.toDate ? formatDate(invoice.createdAt) : 'N/A'}</p>
                                </div>
                                {invoice.items && invoice.items.length > 0 && (
                                  <div className="md:col-span-2">
                                    <p className="text-sm text-gray-600 mb-2">Order Details</p>
                                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                                      {invoice.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                          <span className="text-gray-700">{item.name || item.itemName} x{item.quantity || 1}</span>
                                          <span className="text-gray-800 font-semibold">£{((item.price || 0) * (item.quantity || 1)).toFixed(2)}</span>
                  </div>
                ))}
              </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        } else if (invoice.type === 'package') {
                          return (
                            <div key={invoice.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                                    Invoice #{invoice.id.slice(0, 8).toUpperCase()}
                                  </h3>
                                  <p className="text-sm text-gray-500 mb-1">Type: Package Purchase</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-2xl font-bold text-primary mb-2">£{invoice.amount?.toFixed(2) || '0.00'}</p>
                                  <span className={`inline-block px-3 py-1 rounded text-sm ${
                                    invoice.status === 'completed' 
                                      ? 'bg-green-100 text-green-800' 
                                      : invoice.status === 'pending'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {invoice.status || 'pending'}
                                  </span>
                                </div>
                              </div>
                              <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                                <div>
                                  <p className="text-sm text-gray-600 mb-1">Package</p>
                                  <p className="text-gray-800 font-semibold">
                                    {invoice.package === 'package2' ? 'Package 2 (2% discount)' : invoice.package === 'package3' ? 'Package 3 (5% discount)' : invoice.package}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600 mb-1">Invoice Date</p>
                                  <p className="text-gray-800 font-semibold">{invoice.createdAt?.toDate ? formatDate(invoice.createdAt) : 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600 mb-1">Email</p>
                                  <p className="text-gray-800 font-semibold">{invoice.email || 'N/A'}</p>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>

                    {/* Pagination Controls */}
                    {totalInvoicePages > 1 && (
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => setInvoicePage(prev => Math.max(1, prev - 1))}
                          disabled={invoicePage === 1}
                          className="w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                        >
                          Previous
                        </button>
                        <span className="text-xs sm:text-sm text-gray-600 text-center">
                          Page {invoicePage} of {totalInvoicePages} ({totalInvoices} total invoices)
                        </span>
                        <button
                          onClick={() => setInvoicePage(prev => Math.min(totalInvoicePages, prev + 1))}
                          disabled={invoicePage === totalInvoicePages}
                          className="w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
            )}
          </div>
            );
          })()}

          {/* Profile Setting Tab Content */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Profile Settings</h2>
              <div className="max-w-2xl">
                {profileSuccess && (
                  <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                    {profileSuccess}
                  </div>
                )}
                {profileError && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {profileError}
                  </div>
                )}
                <div className="mb-6">
                  <label className="block text-gray-700 font-semibold mb-2">Name</label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Your name"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-gray-700 font-semibold mb-2">Email</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>
                <div className="mb-6">
                  <label className="block text-gray-700 font-semibold mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="+44 123 456 7890"
                  />
                </div>
                <button
                  onClick={handleProfileUpdate}
                  disabled={profileLoading}
                  className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {profileLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <Footer />

      {/* View Booking Details Modal */}
      {showViewModal && selectedBooking && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4"
          onClick={() => {
            setShowViewModal(false);
            setSelectedBooking(null);
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Booking Details</h3>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedBooking(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 sm:px-6 py-4 sm:py-6">
                <div>
                  <label className="block text-gray-600 text-sm font-semibold mb-1">Complex Name</label>
                  <p className="text-gray-800">{selectedBooking.complex?.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-gray-600 text-sm font-semibold mb-1">Sport</label>
                  <p className="text-gray-800 capitalize">{selectedBooking.sport || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-gray-600 text-sm font-semibold mb-1">Date</label>
                  <p className="text-gray-800">{formatDate(selectedBooking.date)}</p>
                </div>
                <div>
                  <label className="block text-gray-600 text-sm font-semibold mb-1">Time</label>
                  <p className="text-gray-800">{formatTime(selectedBooking.timeSlot)}</p>
                </div>
                <div>
                  <label className="block text-gray-600 text-sm font-semibold mb-1">Duration</label>
                  <p className="text-gray-800">{selectedBooking.hours || 1} {selectedBooking.hours === 1 ? 'Hour' : 'Hours'}</p>
                </div>
                <div>
                  <label className="block text-gray-600 text-sm font-semibold mb-1">Status</label>
                  <span className={`inline-block px-3 py-1 rounded text-sm ${
                    selectedBooking.status === 'confirmed' 
                      ? 'bg-green-100 text-green-800' 
                      : selectedBooking.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedBooking.status || 'pending'}
                  </span>
                </div>
                {selectedBooking.coachRequired && selectedBooking.coachId && (
                  <div>
                    <label className="block text-gray-600 text-sm font-semibold mb-1">Coach</label>
                    <p className="text-gray-800">Coach Included</p>
                  </div>
                )}
                <div>
                  <label className="block text-gray-600 text-sm font-semibold mb-1">Complex Price</label>
                  <p className="text-primary text-xl font-bold">£{getComplexPriceWithDiscount(selectedBooking).toFixed(2)}</p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedBooking(null);
                  }}
                  className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {openMenuId && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setOpenMenuId(null)}
        />
      )}
    </div>
  );
};

export default UserDashboard;
