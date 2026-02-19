import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../hooks/useAuth';
import Header from '../components/Header';
import Footer from '../components/Footer';
import UserBookings from '../components/UserBookings';
import UserInvoices from '../components/UserInvoices';
import UserProfile from '../components/UserProfile';
import Swal from 'sweetalert2';

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [bookings, setBookings] = useState([]);
  const [restaurantPurchases, setRestaurantPurchases] = useState([]);
  const [equipmentPurchases, setEquipmentPurchases] = useState([]);
  const [packagePurchases, setPackagePurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPayments, setTotalPayments] = useState(0);
  const [userProfileData, setUserProfileData] = useState(null);

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
    
    const userPackage = userProfileData?.package || 'basic';
    // Support both old and new package names for backward compatibility
    const isPaidPackage = userPackage && userPackage !== 'basic' && userPackage !== 'normal';
    if (isPaidPackage) {
      const discountPercent = (userPackage === 'silver' || userPackage === 'package2') ? 2 : (userPackage === 'gold' || userPackage === 'package3') ? 5 : 0;
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



  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header user={user} />
      
      <div className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Top Navigation Tabs */}
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
              <UserBookings
                bookings={bookings}
                restaurantPurchases={restaurantPurchases}
                equipmentPurchases={equipmentPurchases}
                loading={loading}
                userProfileData={userProfileData}
                isPreview={true}
                onViewAll={() => setActiveTab('bookings')}
              />
            </>
          )}

          {/* My Bookings Tab Content */}
          {activeTab === 'bookings' && (
            <UserBookings
              bookings={bookings}
              restaurantPurchases={restaurantPurchases}
              equipmentPurchases={equipmentPurchases}
              loading={loading}
              userProfileData={userProfileData}
              isPreview={false}
            />
          )}

          {/* Invoices Tab Content */}
          {activeTab === 'invoices' && (
            <UserInvoices
              bookings={bookings}
              restaurantPurchases={restaurantPurchases}
              equipmentPurchases={equipmentPurchases}
              packagePurchases={packagePurchases}
              loading={loading}
              userProfileData={userProfileData}
              getComplexPriceWithDiscount={getComplexPriceWithDiscount}
            />
          )}

          {/* Profile Setting Tab Content */}
          {activeTab === 'profile' && (
            <UserProfile
              user={user}
              userProfileData={userProfileData}
              setUserProfileData={setUserProfileData}
            />
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default UserDashboard;
