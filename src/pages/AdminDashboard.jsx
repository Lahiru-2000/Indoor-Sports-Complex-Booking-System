import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../hooks/useAuth';
import AdminNavbar from '../components/AdminNavbar';
import AdminSidebar from '../components/AdminSidebar';
import AdminComplexes from '../components/AdminComplexes';
import AdminCoaches from '../components/AdminCoaches';
import AdminUsers from '../components/AdminUsers';
import AdminEquipment from '../components/AdminEquipment';
import AdminRestaurant from '../components/AdminRestaurant';
import AdminRestaurantPurchases from '../components/AdminRestaurantPurchases';
import AdminEquipmentPurchases from '../components/AdminEquipmentPurchases';
import AdminBookings from '../components/AdminBookings';
import { Navigate } from 'react-router-dom';
import { HiClipboard, HiClock, HiCheck, HiX, HiTrendingUp, HiShoppingBag, HiFolder, HiEmojiHappy, HiUserCircle, HiUsers, HiOfficeBuilding } from 'react-icons/hi';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [bookings, setBookings] = useState([]);
  const [complexes, setComplexes] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [users, setUsers] = useState([]);
  const [sportsItems, setSportsItems] = useState([]);
  const [foodItems, setFoodItems] = useState([]);
  const [restaurantPurchases, setRestaurantPurchases] = useState([]);
  const [equipmentPurchases, setEquipmentPurchases] = useState([]);
  const [availableSports, setAvailableSports] = useState([]);
  const [availableEquipmentCategories, setAvailableEquipmentCategories] = useState([]);
  const [availableFoodCategories, setAvailableFoodCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [currentPage, setCurrentPage] = useState({});
  const recordsPerPage = 10;
  
  const [viewingRecord, setViewingRecord] = useState(null);
  const [viewModalType, setViewModalType] = useState(null); // 'booking', 'complex', 'coach', 'user', 'equipment', 'food', 'restaurantPurchase', 'equipmentPurchase'
  

  useEffect(() => {
    fetchData();
    if (activeTab === 'complexes' || activeTab === 'coaches') {
      fetchSports();
    } else if (activeTab === 'equipment') {
      fetchEquipmentCategories();
    } else if (activeTab === 'restaurant') {
      fetchFoodCategories();
    }
    setCurrentPage(prev => ({ ...prev, [activeTab]: 1 }));
  }, [activeTab]);


  const fetchSports = async () => {
    try {
      const sportsSnapshot = await getDocs(collection(db, 'sports'));
      const sportsData = sportsSnapshot.docs.map(doc => doc.data().name).filter(Boolean);
      setAvailableSports(sportsData);
      console.log('Sports fetched:', sportsData);
    } catch (error) {
      console.error('Error fetching sports:', error);
      setAvailableSports([]);
    }
  };

  const fetchEquipmentCategories = async () => {
    try {
      const categoriesSnapshot = await getDocs(collection(db, 'equipmentCategories'));
      const categoriesData = categoriesSnapshot.docs.map(doc => doc.data().name).filter(Boolean);
      setAvailableEquipmentCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching equipment categories:', error);
    }
  };

  const fetchFoodCategories = async () => {
    try {
      const categoriesSnapshot = await getDocs(collection(db, 'foodCategories'));
      const categoriesData = categoriesSnapshot.docs.map(doc => doc.data().name).filter(Boolean);
      setAvailableFoodCategories(categoriesData);
              } catch (error) {
      console.error('Error fetching food categories:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard') {
        const [bookingsSnapshot, complexesSnapshot, coachesSnapshot, usersSnapshot, itemsSnapshot, foodSnapshot] = await Promise.all([
          getDocs(collection(db, 'bookings')),
          getDocs(collection(db, 'complexes')),
          getDocs(collection(db, 'coaches')),
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'sportsItems')),
          getDocs(collection(db, 'foodItems'))
        ]);

        const usersMap = {};
        usersSnapshot.docs.forEach(docSnap => {
          const userData = docSnap.data();
          if (userData.status !== 'deleted') {
            usersMap[docSnap.id] = userData.email || '';
          }
        });

        const complexesMap = {};
        complexesSnapshot.docs.forEach(docSnap => {
          const complexData = docSnap.data();
          if (complexData.status !== 'deleted') {
            complexesMap[docSnap.id] = { id: docSnap.id, ...complexData };
          }
        });

        const bookingsData = bookingsSnapshot.docs
          .map(doc => {
            const bookingData = { id: doc.id, ...doc.data() };
            if (bookingData.userId && usersMap[bookingData.userId]) {
              bookingData.userEmail = usersMap[bookingData.userId];
            }
            if (bookingData.complexId) {
              if (complexesMap[bookingData.complexId]) {
                bookingData.complex = complexesMap[bookingData.complexId];
              } else {
                console.warn(`Complex not found for booking ${bookingData.id}: complexId=${bookingData.complexId}`);
              }
            }
            return bookingData;
          })
          .filter(booking => booking.status !== 'deleted')
          .sort((a, b) => {
            const aTime = a.createdAt?.toDate?.()?.getTime() || a.createdAt || 0;
            const bTime = b.createdAt?.toDate?.()?.getTime() || b.createdAt || 0;
            return bTime - aTime; // Most recent first
          });
        setBookings(bookingsData);

        const complexesData = complexesSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(complex => complex.status !== 'deleted');
        setComplexes(complexesData);

        // Reuse complexesMap that was already created for bookings
        const coachesData = coachesSnapshot.docs
          .map(doc => {
            const coachData = { id: doc.id, ...doc.data() };
            if (coachData.complexId) {
              if (complexesMap[coachData.complexId]) {
                coachData.complex = complexesMap[coachData.complexId];
              } else {
                console.warn(`Complex not found for coach ${coachData.id}: complexId=${coachData.complexId}`);
              }
            }
            return coachData;
          })
          .filter(coach => coach.status !== 'deleted');
        setCoaches(coachesData);

        const usersData = usersSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(user => user.status !== 'deleted' && user.role !== 'admin');
        setUsers(usersData);

        const itemsData = itemsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(item => item.status !== 'deleted');
        setSportsItems(itemsData);

        const foodData = foodSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(item => item.status !== 'deleted');
        setFoodItems(foodData);
      } else if (activeTab === 'bookings') {
        const [usersSnapshot, complexesSnapshot] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'complexes'))
        ]);
        
        const usersMap = {};
        usersSnapshot.docs.forEach(docSnap => {
          const userData = docSnap.data();
          if (userData.status !== 'deleted') {
            usersMap[docSnap.id] = userData.email || '';
          }
        });

        const complexesMap = {};
        complexesSnapshot.docs.forEach(docSnap => {
          const complexData = docSnap.data();
          if (complexData.status !== 'deleted') {
            complexesMap[docSnap.id] = { id: docSnap.id, ...complexData };
          }
        });

        const bookingsSnapshot = await getDocs(collection(db, 'bookings'));
        const bookingsData = bookingsSnapshot.docs
          .map(doc => {
            const bookingData = { id: doc.id, ...doc.data() };
            if (bookingData.userId && usersMap[bookingData.userId]) {
              bookingData.userEmail = usersMap[bookingData.userId];
            }
            if (bookingData.complexId) {
              if (complexesMap[bookingData.complexId]) {
                bookingData.complex = complexesMap[bookingData.complexId];
              } else {
                console.warn(`Complex not found for booking ${bookingData.id}: complexId=${bookingData.complexId}`);
              }
            }
            return bookingData;
          })
          .filter(booking => booking.status !== 'deleted')
          .sort((a, b) => {
            const aTime = a.createdAt?.toDate?.()?.getTime() || a.createdAt || 0;
            const bTime = b.createdAt?.toDate?.()?.getTime() || b.createdAt || 0;
            return bTime - aTime;
          });
        setBookings(bookingsData);
      } else if (activeTab === 'complexes') {
        const complexesSnapshot = await getDocs(collection(db, 'complexes'));
        const complexesData = complexesSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(complex => complex.status !== 'deleted')
          .sort((a, b) => {
            const aTime = a.createdAt?.toDate?.()?.getTime() || a.createdAt || 0;
            const bTime = b.createdAt?.toDate?.()?.getTime() || b.createdAt || 0;
            return bTime - aTime;
          });
        setComplexes(complexesData);
      } else if (activeTab === 'coaches') {
        const [coachesSnapshot, complexesSnapshot] = await Promise.all([
          getDocs(collection(db, 'coaches')),
          getDocs(collection(db, 'complexes'))
        ]);
        
        const complexesMap = {};
        complexesSnapshot.docs.forEach(docSnap => {
          const complexData = docSnap.data();
          if (complexData.status !== 'deleted') {
            complexesMap[docSnap.id] = { id: docSnap.id, ...complexData };
          }
        });
        
        const coachesData = coachesSnapshot.docs
          .map(doc => {
            const coachData = { id: doc.id, ...doc.data() };
            if (coachData.complexId) {
              if (complexesMap[coachData.complexId]) {
                coachData.complex = complexesMap[coachData.complexId];
              } else {
                console.warn(`Complex not found for coach ${coachData.id}: complexId=${coachData.complexId}`);
              }
            }
            return coachData;
          })
          .filter(coach => coach.status !== 'deleted')
          .sort((a, b) => {
            const aTime = a.createdAt?.toDate?.()?.getTime() || a.createdAt || 0;
            const bTime = b.createdAt?.toDate?.()?.getTime() || b.createdAt || 0;
            return bTime - aTime;
          });
        setCoaches(coachesData);
        
        const complexesData = complexesSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(complex => complex.status !== 'deleted');
        setComplexes(complexesData);
      } else if (activeTab === 'users') {
        const [usersSnapshot, bookingsSnapshot] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'bookings'))
        ]);
        const usersData = usersSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(user => user.status !== 'deleted' && user.role !== 'admin')
          .sort((a, b) => {
            const aTime = a.createdAt?.toDate?.()?.getTime() || a.createdAt || 0;
            const bTime = b.createdAt?.toDate?.()?.getTime() || b.createdAt || 0;
            return bTime - aTime;
          });
        setUsers(usersData);
        
        const bookingsData = bookingsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(booking => booking.status !== 'deleted');
        setBookings(bookingsData);
      } else if (activeTab === 'equipment') {
        const [itemsSnapshot, complexesSnapshot] = await Promise.all([
          getDocs(collection(db, 'sportsItems')),
          getDocs(collection(db, 'complexes'))
        ]);
        const itemsData = itemsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(item => item.status !== 'deleted')
          .sort((a, b) => {
            const aTime = a.createdAt?.toDate?.()?.getTime() || a.createdAt || 0;
            const bTime = b.createdAt?.toDate?.()?.getTime() || b.createdAt || 0;
            return bTime - aTime;
          });
        setSportsItems(itemsData);
        
        const complexesData = complexesSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(complex => complex.status !== 'deleted');
        setComplexes(complexesData);
      } else if (activeTab === 'restaurant') {
          const foodSnapshot = await getDocs(collection(db, 'foodItems'));
        const foodData = foodSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(item => item.status !== 'deleted')
          .sort((a, b) => {
            const aTime = a.createdAt?.toDate?.()?.getTime() || a.createdAt || 0;
            const bTime = b.createdAt?.toDate?.()?.getTime() || b.createdAt || 0;
            return bTime - aTime;
          });
        setFoodItems(foodData);
      } else if (activeTab === 'restaurantPurchases') {
        const [complexesSnapshot, usersSnapshot] = await Promise.all([
          getDocs(collection(db, 'complexes')),
          getDocs(collection(db, 'users'))
        ]);
        
        const complexesMap = {};
        complexesSnapshot.docs.forEach(docSnap => {
          const complexData = docSnap.data();
          if (complexData.status !== 'deleted') {
            complexesMap[docSnap.id] = { id: docSnap.id, ...complexData };
          }
        });

        const complexesData = complexesSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(complex => complex.status !== 'deleted');
        setComplexes(complexesData);

        const usersMap = {};
        usersSnapshot.docs.forEach(docSnap => {
          const userData = docSnap.data();
          if (userData.status !== 'deleted') {
            usersMap[docSnap.id] = userData.email || '';
          }
        });

        const purchasesSnapshot = await getDocs(collection(db, 'restaurantPurchases'));
        const purchasesData = purchasesSnapshot.docs.map(docSnap => {
          const purchaseData = { id: docSnap.id, ...docSnap.data() };
          if (purchaseData.complexId) {
            if (complexesMap[purchaseData.complexId]) {
              purchaseData.complex = complexesMap[purchaseData.complexId];
            } else {
              console.warn(`Complex not found for purchase ${purchaseData.id}: complexId=${purchaseData.complexId}`);
            }
      } else {
            console.warn(`Purchase ${purchaseData.id} has no complexId`);
          }
          if (purchaseData.userId && usersMap[purchaseData.userId]) {
            purchaseData.userEmail = usersMap[purchaseData.userId];
          }
          return purchaseData;
        });
        
        const sortedPurchases = purchasesData.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.()?.getTime() || a.createdAt || 0;
          const bTime = b.createdAt?.toDate?.()?.getTime() || b.createdAt || 0;
          return bTime - aTime;
        });
        setRestaurantPurchases(sortedPurchases);
      } else if (activeTab === 'equipmentPurchases') {
        const [complexesSnapshot, usersSnapshot] = await Promise.all([
          getDocs(collection(db, 'complexes')),
          getDocs(collection(db, 'users'))
        ]);
        
        const complexesMap = {};
        complexesSnapshot.docs.forEach(docSnap => {
          const complexData = docSnap.data();
          if (complexData.status !== 'deleted') {
            complexesMap[docSnap.id] = { id: docSnap.id, ...complexData };
          }
        });

        const complexesData = complexesSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(complex => complex.status !== 'deleted');
        setComplexes(complexesData);

        const usersMap = {};
        usersSnapshot.docs.forEach(docSnap => {
          const userData = docSnap.data();
          if (userData.status !== 'deleted') {
            usersMap[docSnap.id] = userData.email || '';
          }
        });

        const purchasesSnapshot = await getDocs(collection(db, 'equipmentPurchases'));
        const purchasesData = purchasesSnapshot.docs.map(docSnap => {
          const purchaseData = { id: docSnap.id, ...docSnap.data() };
          if (purchaseData.complexId) {
            if (complexesMap[purchaseData.complexId]) {
              purchaseData.complex = complexesMap[purchaseData.complexId];
            } else {
              console.warn(`Complex not found for purchase ${purchaseData.id}: complexId=${purchaseData.complexId}`);
            }
          } else {
            console.warn(`Purchase ${purchaseData.id} has no complexId`);
          }
          if (purchaseData.userId && usersMap[purchaseData.userId]) {
            purchaseData.userEmail = usersMap[purchaseData.userId];
          }
          return purchaseData;
        });
        
        const sortedPurchases = purchasesData.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.()?.getTime() || a.createdAt || 0;
          const bTime = b.createdAt?.toDate?.()?.getTime() || b.createdAt || 0;
          return bTime - aTime;
        });
        setEquipmentPurchases(sortedPurchases);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };


  const getBookingStats = () => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisWeekBookings = bookings.filter(booking => {
      if (!booking.createdAt) return false;
      const createdAt = booking.createdAt?.toDate ? booking.createdAt.toDate() : new Date(booking.createdAt);
      return createdAt >= oneWeekAgo;
    });
    return {
      total: bookings.length,
      pending: bookings.filter(b => b.status === 'pending').length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
      thisWeek: thisWeekBookings.length
    };
  };

  const getEquipmentStats = () => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const categories = [...new Set(sportsItems.map(item => item.category).filter(Boolean))];
    const thisWeekItems = sportsItems.filter(item => {
      if (!item.createdAt) return false;
      const createdAt = item.createdAt?.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
      return createdAt >= oneWeekAgo;
    });
    return {
      total: sportsItems.length,
      categories: categories.length,
      thisWeek: thisWeekItems.length,
      averagePrice: sportsItems.length > 0 
        ? (sportsItems.reduce((sum, item) => sum + (item.price || 0), 0) / sportsItems.length).toFixed(2)
        : '0.00'
    };
  };

  const getFoodStats = () => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const categories = [...new Set(foodItems.map(item => item.category).filter(Boolean))];
    const thisWeekItems = foodItems.filter(item => {
      if (!item.createdAt) return false;
      const createdAt = item.createdAt?.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
      return createdAt >= oneWeekAgo;
    });
    return {
      total: foodItems.length,
      categories: categories.length,
      thisWeek: thisWeekItems.length,
      averagePrice: foodItems.length > 0
        ? (foodItems.reduce((sum, item) => sum + (item.price || 0), 0) / foodItems.length).toFixed(2)
        : '0.00'
    };
  };

  const getUserStats = () => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const thisWeekUsers = users.filter(user => {
      if (!user.createdAt) return false;
      const createdAt = user.createdAt?.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
      return createdAt >= oneWeekAgo;
    });
    const activeUsers = users.filter(user => {
      if (!user.createdAt) return false;
      const createdAt = user.createdAt?.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
      return createdAt >= thirtyDaysAgo;
    });
    return {
      total: users.length,
      active: activeUsers.length,
      inactive: users.length - activeUsers.length,
      thisWeek: thisWeekUsers.length
    };
  };



  // Redirect if not admin
  if (user && user.role !== 'admin') {
    return <Navigate to="/user/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar user={user} />
      <div className="flex pt-16">
        <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 ml-64 p-6">
          <div className="max-w-7xl mx-auto">

          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-600">Loading...</div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-6">
              {activeTab === 'dashboard' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Overview</h2>
                  
                  {/* Key Statistics Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Bookings */}
                    <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                          <p className="text-3xl font-bold text-gray-800 mt-2">{getBookingStats().total}</p>
                        </div>
                        <HiClipboard className="w-12 h-12 text-blue-500" />
                      </div>
                    </div>

                    {/* Total Users */}
                    <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Users</p>
                          <p className="text-3xl font-bold text-gray-800 mt-2">{getUserStats().total}</p>
                        </div>
                        <HiUsers className="w-12 h-12 text-green-500" />
                      </div>
                    </div>

                    {/* Total Complexes */}
                    <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Complexes</p>
                          <p className="text-3xl font-bold text-gray-800 mt-2">{complexes.length}</p>
                        </div>
                        <HiOfficeBuilding className="w-12 h-12 text-purple-500" />
                      </div>
                    </div>

                    {/* Total Coaches */}
                    <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-orange-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Coaches</p>
                          <p className="text-3xl font-bold text-gray-800 mt-2">{coaches.length}</p>
                        </div>
                        <HiUserCircle className="w-12 h-12 text-orange-500" />
                      </div>
                    </div>
                  </div>

                  {/* Booking Statistics */}
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Booking Statistics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-yellow-500">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Pending</p>
                            <p className="text-2xl font-bold text-gray-800 mt-2">{getBookingStats().pending}</p>
                          </div>
                          <HiClock className="w-10 h-10 text-yellow-500" />
                        </div>
                      </div>
                      <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Confirmed</p>
                            <p className="text-2xl font-bold text-gray-800 mt-2">{getBookingStats().confirmed}</p>
                          </div>
                          <HiCheck className="w-10 h-10 text-green-500" />
                        </div>
                      </div>
                      <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-500">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Cancelled</p>
                            <p className="text-2xl font-bold text-gray-800 mt-2">{getBookingStats().cancelled}</p>
                          </div>
                          <HiX className="w-10 h-10 text-red-500" />
                        </div>
                      </div>
                      <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">This Week</p>
                            <p className="text-2xl font-bold text-gray-800 mt-2">{getBookingStats().thisWeek}</p>
                          </div>
                          <HiTrendingUp className="w-10 h-10 text-purple-500" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Shop Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Equipment Shop */}
                    <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
                      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                        <HiShoppingBag className="w-6 h-6 mr-2 text-blue-500" />
                        Equipment Shop
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Total Items</p>
                          <p className="text-2xl font-bold text-gray-800">{getEquipmentStats().total}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Categories</p>
                          <p className="text-2xl font-bold text-gray-800">{getEquipmentStats().categories}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">This Week</p>
                          <p className="text-2xl font-bold text-gray-800">{getEquipmentStats().thisWeek}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Avg. Price</p>
                          <p className="text-2xl font-bold text-gray-800">£{getEquipmentStats().averagePrice}</p>
                        </div>
                      </div>
                    </div>

                    {/* Restaurant */}
                    <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
                      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                        <HiEmojiHappy className="w-6 h-6 mr-2 text-red-500" />
                        Restaurant
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Total Items</p>
                          <p className="text-2xl font-bold text-gray-800">{getFoodStats().total}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Categories</p>
                          <p className="text-2xl font-bold text-gray-800">{getFoodStats().categories}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">This Week</p>
                          <p className="text-2xl font-bold text-gray-800">{getFoodStats().thisWeek}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Avg. Price</p>
                          <p className="text-2xl font-bold text-gray-800">£{getFoodStats().averagePrice}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Bookings */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Bookings</h3>
                    {bookings.length === 0 ? (
                      <p className="text-gray-600">No bookings found.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking ID</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sport</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {bookings.slice(0, 5).map((booking) => (
                              <tr key={booking.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {booking.id.substring(0, 8)}...
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{booking.sport || 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {booking.date?.toDate ? booking.date.toDate().toLocaleDateString() : booking.date || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">£{booking.total?.toFixed(2) || '0.00'}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                    booking.status === 'confirmed' 
                                      ? 'bg-green-100 text-green-800' 
                                      : booking.status === 'pending'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {booking.status || 'pending'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {bookings.length > 5 && (
                      <div className="mt-4 text-center">
                        <button
                          onClick={() => setActiveTab('bookings')}
                          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
                        >
                          View All Bookings
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'bookings' && (
                <AdminBookings
                  bookings={bookings}
                  onRefresh={fetchData}
                  setViewingRecord={setViewingRecord}
                  setViewModalType={setViewModalType}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  recordsPerPage={recordsPerPage}
                />
              )}

              {activeTab === 'complexes' && (
                <AdminComplexes
                  complexes={complexes}
                  onRefresh={fetchData}
                  availableSports={availableSports}
                  onFetchSports={fetchSports}
                  setViewingRecord={setViewingRecord}
                  setViewModalType={setViewModalType}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  recordsPerPage={recordsPerPage}
                />
              )}

              {activeTab === 'coaches' && (
                <AdminCoaches
                  coaches={coaches}
                  complexes={complexes}
                  onRefresh={fetchData}
                  availableSports={availableSports}
                  onFetchSports={fetchSports}
                  setViewingRecord={setViewingRecord}
                  setViewModalType={setViewModalType}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  recordsPerPage={recordsPerPage}
                />
              )}

              {activeTab === 'users' && (
                <AdminUsers
                  users={users}
                  bookings={bookings}
                  onRefresh={fetchData}
                  setViewingRecord={setViewingRecord}
                  setViewModalType={setViewModalType}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  recordsPerPage={recordsPerPage}
                />
              )}

              {activeTab === 'equipment' && (
                <AdminEquipment
                  sportsItems={sportsItems}
                  complexes={complexes}
                  onRefresh={fetchData}
                  availableEquipmentCategories={availableEquipmentCategories}
                  onFetchEquipmentCategories={fetchEquipmentCategories}
                  setViewingRecord={setViewingRecord}
                  setViewModalType={setViewModalType}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  recordsPerPage={recordsPerPage}
                />
              )}

              {activeTab === 'restaurant' && (
                <AdminRestaurant
                  foodItems={foodItems}
                  onRefresh={fetchData}
                  availableFoodCategories={availableFoodCategories}
                  onFetchFoodCategories={fetchFoodCategories}
                  setViewingRecord={setViewingRecord}
                  setViewModalType={setViewModalType}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  recordsPerPage={recordsPerPage}
                />
              )}

              {activeTab === 'restaurantPurchases' && (
                <AdminRestaurantPurchases
                  restaurantPurchases={restaurantPurchases}
                  complexes={complexes}
                  onRefresh={fetchData}
                  setViewingRecord={setViewingRecord}
                  setViewModalType={setViewModalType}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  recordsPerPage={recordsPerPage}
                />
              )}

              {activeTab === 'equipmentPurchases' && (
                <AdminEquipmentPurchases
                  equipmentPurchases={equipmentPurchases}
                  complexes={complexes}
                  onRefresh={fetchData}
                  setViewingRecord={setViewingRecord}
                  setViewModalType={setViewModalType}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  recordsPerPage={recordsPerPage}
                />
              )}
              
            </div>
          )}
        </div>
        </main>
      </div>

      {/* View Modals */}
      {viewingRecord && viewModalType && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setViewingRecord(null);
            setViewModalType(null);
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-800">
                {viewModalType === 'booking' && 'Booking Details'}
                {viewModalType === 'complex' && 'Complex Details'}
                {viewModalType === 'coach' && 'Coach Details'}
                {viewModalType === 'user' && 'User Details'}
                {viewModalType === 'equipment' && 'Equipment Details'}
                {viewModalType === 'food' && 'Food Item Details'}
                {viewModalType === 'restaurantPurchase' && 'Restaurant Purchase Details'}
                {viewModalType === 'equipmentPurchase' && 'Equipment Purchase Details'}
              </h3>
              <button
                onClick={() => {
                  setViewingRecord(null);
                  setViewModalType(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {viewModalType === 'booking' && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-600 text-sm font-semibold mb-1">Booking ID</label>
                    <p className="text-gray-800">{viewingRecord.id}</p>
                  </div>
                  <div>
                    <label className="block text-gray-600 text-sm font-semibold mb-1">User Email</label>
                    <p className="text-gray-800">{viewingRecord.userEmail || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-gray-600 text-sm font-semibold mb-1">Complex</label>
                    <p className="text-gray-800">{viewingRecord.complex?.name || (viewingRecord.complexId ? `ID: ${viewingRecord.complexId}` : 'N/A')}</p>
                  </div>
                  <div>
                    <label className="block text-gray-600 text-sm font-semibold mb-1">Sport</label>
                    <p className="text-gray-800 capitalize">{viewingRecord.sport || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-gray-600 text-sm font-semibold mb-1">Date</label>
                    <p className="text-gray-800">
                      {viewingRecord.date?.toDate ? viewingRecord.date.toDate().toLocaleDateString() : viewingRecord.date || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-gray-600 text-sm font-semibold mb-1">Time Slot</label>
                    <p className="text-gray-800">{viewingRecord.timeSlot || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-gray-600 text-sm font-semibold mb-1">Hours</label>
                    <p className="text-gray-800">{viewingRecord.hours || 1}</p>
                  </div>
                  <div>
                    <label className="block text-gray-600 text-sm font-semibold mb-1">Status</label>
                    <span className={`inline-block px-3 py-1 rounded text-sm ${
                      viewingRecord.status === 'confirmed' 
                        ? 'bg-green-100 text-green-800' 
                        : viewingRecord.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {viewingRecord.status || 'pending'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-gray-600 text-sm font-semibold mb-1">Total Amount</label>
                    <p className="text-primary text-xl font-bold">£{viewingRecord.total?.toFixed(2) || '0.00'}</p>
                  </div>
                  {viewingRecord.coachRequired && (
                    <div>
                      <label className="block text-gray-600 text-sm font-semibold mb-1">Coach Required</label>
                      <p className="text-gray-800">Yes</p>
                    </div>
                  )}
                  {viewingRecord.sportEquipment && viewingRecord.sportEquipment.length > 0 && (
                    <div className="md:col-span-2">
                      <label className="block text-gray-600 text-sm font-semibold mb-1">Sport Equipment</label>
                      <p className="text-gray-800">{viewingRecord.sportEquipment.join(', ')}</p>
                    </div>
                  )}
                </div>
              )}

              {viewModalType === 'complex' && (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-600 text-sm font-semibold mb-1">Name</label>
                      <p className="text-gray-800">{viewingRecord.name}</p>
                    </div>
                    <div>
                      <label className="block text-gray-600 text-sm font-semibold mb-1">Location</label>
                      <p className="text-gray-800">{viewingRecord.location || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-gray-600 text-sm font-semibold mb-1">Price per Hour</label>
                      <p className="text-gray-800">£{viewingRecord.pricePerHour?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div>
                      <label className="block text-gray-600 text-sm font-semibold mb-1">Sports</label>
                      <p className="text-gray-800">
                        {Array.isArray(viewingRecord.sports) ? viewingRecord.sports.join(', ') : 'N/A'}
                      </p>
                    </div>
                    {viewingRecord.description && (
                      <div className="md:col-span-2">
                        <label className="block text-gray-600 text-sm font-semibold mb-1">Description</label>
                        <p className="text-gray-800">{viewingRecord.description}</p>
                      </div>
                    )}
                    {viewingRecord.featuresText && (
                      <div className="md:col-span-2">
                        <label className="block text-gray-600 text-sm font-semibold mb-1">Features</label>
                        <p className="text-gray-800">{viewingRecord.featuresText}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {viewModalType === 'coach' && (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-600 text-sm font-semibold mb-1">Name</label>
                      <p className="text-gray-800">{viewingRecord.name}</p>
                    </div>
                    <div>
                      <label className="block text-gray-600 text-sm font-semibold mb-1">Speciality</label>
                      <p className="text-gray-800">{viewingRecord.speciality || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-gray-600 text-sm font-semibold mb-1">Complex</label>
                      <p className="text-gray-800">{viewingRecord.complex?.name || (viewingRecord.complexId ? `ID: ${viewingRecord.complexId}` : 'N/A')}</p>
                    </div>
                    <div>
                      <label className="block text-gray-600 text-sm font-semibold mb-1">Sports</label>
                      <p className="text-gray-800">
                        {Array.isArray(viewingRecord.sports) && viewingRecord.sports.length > 0 
                          ? viewingRecord.sports.join(', ') 
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-gray-600 text-sm font-semibold mb-1">Price</label>
                      <p className="text-gray-800">£{viewingRecord.price?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div>
                      <label className="block text-gray-600 text-sm font-semibold mb-1">Experience</label>
                      <p className="text-gray-800">{viewingRecord.experience || 'N/A'}</p>
                    </div>
                    {viewingRecord.bio && (
                      <div className="md:col-span-2">
                        <label className="block text-gray-600 text-sm font-semibold mb-1">Bio</label>
                        <p className="text-gray-800">{viewingRecord.bio}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {viewModalType === 'user' && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-600 text-sm font-semibold mb-1">Name</label>
                    <p className="text-gray-800">{viewingRecord.name || 'No name'}</p>
                  </div>
                  <div>
                    <label className="block text-gray-600 text-sm font-semibold mb-1">Email</label>
                    <p className="text-gray-800">{viewingRecord.email}</p>
                  </div>
                  <div>
                    <label className="block text-gray-600 text-sm font-semibold mb-1">Role</label>
                    <span className={`inline-block px-3 py-1 rounded text-sm ${
                      viewingRecord.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {viewingRecord.role || 'user'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-gray-600 text-sm font-semibold mb-1">Phone</label>
                    <p className="text-gray-800">{viewingRecord.phone || 'N/A'}</p>
                  </div>
                  {viewingRecord.package && (
                    <div>
                      <label className="block text-gray-600 text-sm font-semibold mb-1">Package</label>
                      <p className="text-gray-800 capitalize">
                        {viewingRecord.package === 'basic' || viewingRecord.package === 'normal' ? 'Basic' :
                         viewingRecord.package === 'silver' || viewingRecord.package === 'package2' ? 'Silver' :
                         viewingRecord.package === 'gold' || viewingRecord.package === 'package3' ? 'Gold' :
                         viewingRecord.package || 'Basic'}
                      </p>
                    </div>
                  )}
                  {viewingRecord.createdAt && (
                    <div>
                      <label className="block text-gray-600 text-sm font-semibold mb-1">Created At</label>
                      <p className="text-gray-800">
                        {viewingRecord.createdAt?.toDate ? viewingRecord.createdAt.toDate().toLocaleString() : 'N/A'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {viewModalType === 'equipment' && (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-600 text-sm font-semibold mb-1">Name</label>
                      <p className="text-gray-800">{viewingRecord.name}</p>
                    </div>
                    <div>
                      <label className="block text-gray-600 text-sm font-semibold mb-1">Category</label>
                      <p className="text-gray-800 capitalize">{viewingRecord.category || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-gray-600 text-sm font-semibold mb-1">Price</label>
                      <p className="text-gray-800">£{viewingRecord.price?.toFixed(2) || '0.00'}</p>
                    </div>
                    {viewingRecord.description && (
                      <div className="md:col-span-2">
                        <label className="block text-gray-600 text-sm font-semibold mb-1">Description</label>
                        <p className="text-gray-800">{viewingRecord.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {viewModalType === 'food' && (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-600 text-sm font-semibold mb-1">Name</label>
                      <p className="text-gray-800">{viewingRecord.name}</p>
                    </div>
                    <div>
                      <label className="block text-gray-600 text-sm font-semibold mb-1">Category</label>
                      <p className="text-gray-800 capitalize">{viewingRecord.category || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-gray-600 text-sm font-semibold mb-1">Price</label>
                      <p className="text-gray-800">£{viewingRecord.price?.toFixed(2) || '0.00'}</p>
                    </div>
                    {viewingRecord.description && (
                      <div className="md:col-span-2">
                        <label className="block text-gray-600 text-sm font-semibold mb-1">Description</label>
                        <p className="text-gray-800">{viewingRecord.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(viewModalType === 'restaurantPurchase' || viewModalType === 'equipmentPurchase') && (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-600 text-sm font-semibold mb-1">Purchase ID</label>
                      <p className="text-gray-800 font-mono text-sm">{viewingRecord.id}</p>
                    </div>
                    <div>
                      <label className="block text-gray-600 text-sm font-semibold mb-1">User Email</label>
                      <p className="text-gray-800">{viewingRecord.userEmail || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-gray-600 text-sm font-semibold mb-1">Complex</label>
                      <p className="text-gray-800">{viewingRecord.complex?.name || (viewingRecord.complexId ? `ID: ${viewingRecord.complexId}` : 'N/A')}</p>
                    </div>
                    <div>
                      <label className="block text-gray-600 text-sm font-semibold mb-1">Status</label>
                      <span className={`inline-block px-3 py-1 rounded text-sm ${
                        viewingRecord.status === 'confirmed' 
                          ? 'bg-green-100 text-green-800' 
                          : viewingRecord.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {viewingRecord.status || 'pending'}
                      </span>
                    </div>
                    <div>
                      <label className="block text-gray-600 text-sm font-semibold mb-1">Total Amount</label>
                      <p className="text-primary text-xl font-bold">£{viewingRecord.total?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div>
                      <label className="block text-gray-600 text-sm font-semibold mb-1">Date</label>
                      <p className="text-gray-800">
                        {viewingRecord.createdAt?.toDate ? viewingRecord.createdAt.toDate().toLocaleString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  {viewingRecord.items && viewingRecord.items.length > 0 && (
                    <div>
                      <label className="block text-gray-600 text-sm font-semibold mb-2">Items</label>
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {viewingRecord.items.map((item, index) => (
                              <tr key={index}>
                                <td className="px-4 py-2 text-sm text-gray-900">{item.name || 'N/A'}</td>
                                <td className="px-4 py-2 text-sm text-gray-500">{item.quantity || 0}</td>
                                <td className="px-4 py-2 text-sm text-gray-500">£{item.price?.toFixed(2) || '0.00'}</td>
                                <td className="px-4 py-2 text-sm text-gray-500">£{((item.quantity || 0) * (item.price || 0)).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setViewingRecord(null);
                    setViewModalType(null);
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
    </div>
  );
};

export default AdminDashboard;
