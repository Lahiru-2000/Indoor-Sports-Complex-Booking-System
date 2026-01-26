import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../hooks/useAuth';
import AdminNavbar from '../components/AdminNavbar';
import AdminSidebar from '../components/AdminSidebar';
import { Navigate } from 'react-router-dom';
import { HiPencil, HiTrash, HiCheckCircle, HiXCircle, HiClipboard, HiClock, HiCheck, HiX, HiTrendingUp, HiShoppingBag, HiFolder, HiEmojiHappy, HiUserCircle, HiUsers, HiOfficeBuilding, HiEye } from 'react-icons/hi';
import Swal from 'sweetalert2';

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
  const [newEquipmentCategoryName, setNewEquipmentCategoryName] = useState('');
  const [newFoodCategoryName, setNewFoodCategoryName] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [currentPage, setCurrentPage] = useState({});
  const recordsPerPage = 10;
  
  const [showComplexForm, setShowComplexForm] = useState(false);
  const [showCoachForm, setShowCoachForm] = useState(false);
  const [showEquipmentForm, setShowEquipmentForm] = useState(false);
  const [showFoodForm, setShowFoodForm] = useState(false);
  const [editingComplex, setEditingComplex] = useState(null);
  const [editingCoach, setEditingCoach] = useState(null);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [editingFood, setEditingFood] = useState(null);
  const [newSportName, setNewSportName] = useState('');
  
  const [viewingRecord, setViewingRecord] = useState(null);
  const [viewModalType, setViewModalType] = useState(null); // 'booking', 'complex', 'coach', 'user', 'equipment', 'food', 'restaurantPurchase', 'equipmentPurchase'
  
  const [complexForm, setComplexForm] = useState({
    name: '',
    description: '',
    pricePerHour: '',
    image: '',
    location: '',
    sports: [],
    featuresText: ''
  });
  const [coachForm, setCoachForm] = useState({
    name: '',
    price: '',
    complexId: '',
    speciality: '',
    bio: '',
    image: '',
    experience: ''
  });
  const [equipmentForm, setEquipmentForm] = useState({
    name: '',
    category: '',
    price: '',
    description: '',
    image: ''
  });
  const [foodForm, setFoodForm] = useState({
    name: '',
    category: '',
    price: '',
    description: '',
    image: ''
  });
  
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [bookingDateRangeStart, setBookingDateRangeStart] = useState('');
  const [bookingDateRangeEnd, setBookingDateRangeEnd] = useState('');
  const [bookingSportFilter, setBookingSportFilter] = useState('all');

  useEffect(() => {
    fetchData();
    if (activeTab === 'complexes') {
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
              } catch (error) {
      console.error('Error fetching sports:', error);
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

        const bookingsData = bookingsSnapshot.docs
          .map(doc => {
            const bookingData = { id: doc.id, ...doc.data() };
            if (bookingData.userId && usersMap[bookingData.userId]) {
              bookingData.userEmail = usersMap[bookingData.userId];
            }
            return bookingData;
          })
          .filter(booking => booking.status !== 'deleted');
        setBookings(bookingsData);

        const complexesData = complexesSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(complex => complex.status !== 'deleted');
        setComplexes(complexesData);

        const coachesData = coachesSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
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
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersMap = {};
        usersSnapshot.docs.forEach(docSnap => {
          const userData = docSnap.data();
          if (userData.status !== 'deleted') {
            usersMap[docSnap.id] = userData.email || '';
          }
        });

        const bookingsSnapshot = await getDocs(collection(db, 'bookings'));
        const bookingsData = bookingsSnapshot.docs
          .map(doc => {
            const bookingData = { id: doc.id, ...doc.data() };
            if (bookingData.userId && usersMap[bookingData.userId]) {
              bookingData.userEmail = usersMap[bookingData.userId];
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
        const coachesData = coachesSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
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
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersData = usersSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(user => user.status !== 'deleted' && user.role !== 'admin')
          .sort((a, b) => {
            const aTime = a.createdAt?.toDate?.()?.getTime() || a.createdAt || 0;
            const bTime = b.createdAt?.toDate?.()?.getTime() || b.createdAt || 0;
            return bTime - aTime;
          });
        setUsers(usersData);
      } else if (activeTab === 'equipment') {
        const itemsSnapshot = await getDocs(collection(db, 'sportsItems'));
        const itemsData = itemsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(item => item.status !== 'deleted')
          .sort((a, b) => {
            const aTime = a.createdAt?.toDate?.()?.getTime() || a.createdAt || 0;
            const bTime = b.createdAt?.toDate?.()?.getTime() || b.createdAt || 0;
            return bTime - aTime;
          });
        setSportsItems(itemsData);
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

  const getPaginatedData = (data) => {
    const current = currentPage[activeTab] || 1;
    const startIndex = (current - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (data) => {
    return Math.ceil(data.length / recordsPerPage);
  };

  const handlePageChange = (tab, page) => {
    setCurrentPage(prev => ({ ...prev, [tab]: page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const getFilteredBookings = () => {
    let filtered = bookings;
    if (bookingStatusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === bookingStatusFilter);
    }
    if (bookingDateRangeStart || bookingDateRangeEnd) {
      filtered = filtered.filter(booking => {
        if (!booking.date) return false;
        const bookingDate = typeof booking.date === 'string' ? new Date(booking.date) : (booking.date?.toDate ? booking.date.toDate() : new Date(booking.date));
        const startDate = bookingDateRangeStart ? new Date(bookingDateRangeStart) : new Date(0);
        const endDate = bookingDateRangeEnd ? new Date(bookingDateRangeEnd + 'T23:59:59') : new Date();
        return bookingDate >= startDate && bookingDate <= endDate;
      });
    }
    if (bookingSportFilter !== 'all') {
      filtered = filtered.filter(booking => booking.sport === bookingSportFilter);
    }
    return filtered;
  };

  const updateBookingStatus = async (bookingId, status) => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), { status });
      fetchData();
    } catch (error) {
      console.error('Error updating booking:', error);
    }
  };

  const updateRestaurantPurchaseStatus = async (purchaseId, status) => {
    try {
      await updateDoc(doc(db, 'restaurantPurchases', purchaseId), { status });
      fetchData();
    } catch (error) {
      console.error('Error updating restaurant purchase:', error);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: 'Error updating purchase status. Please try again.',
        confirmButtonColor: '#10b981'
      });
    }
  };

  const updateEquipmentPurchaseStatus = async (purchaseId, status) => {
    try {
      await updateDoc(doc(db, 'equipmentPurchases', purchaseId), { status });
      fetchData();
    } catch (error) {
      console.error('Error updating equipment purchase:', error);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: 'Error updating purchase status. Please try again.',
        confirmButtonColor: '#10b981'
      });
    }
  };


  const handleDeleteUser = async (userId) => {
    const result = await Swal.fire({
      title: 'Delete User',
      text: 'Are you sure you want to delete this user?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });
    if (!result.isConfirmed) return;
    try {
      await updateDoc(doc(db, 'users', userId), { status: 'deleted', deletedAt: serverTimestamp() });
      fetchData();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleComplexSubmit = async (e) => {
    e.preventDefault();
    try {
      const features = complexForm.featuresText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
      
      const complexData = {
        name: complexForm.name,
        description: complexForm.description,
        pricePerHour: parseFloat(complexForm.pricePerHour) || 0,
        image: complexForm.image,
        location: complexForm.location,
        sports: complexForm.sports || [],
        features: features
      };

      if (editingComplex) {
        await updateDoc(doc(db, 'complexes', editingComplex.id), complexData);
      } else {
        await addDoc(collection(db, 'complexes'), {
          ...complexData,
          createdAt: serverTimestamp()
        });
      }

      setShowComplexForm(false);
      setEditingComplex(null);
      setComplexForm({ name: '', description: '', pricePerHour: '', image: '', location: '', sports: [], featuresText: '' });
      fetchData();
    } catch (error) {
      console.error('Error saving complex:', error);
      Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: 'Error saving complex. Please try again.',
        confirmButtonColor: '#10b981'
      });
    }
  };

  const handleEditComplex = (complex) => {
    setEditingComplex(complex);
    setComplexForm({
      name: complex.name || '',
      description: complex.description || '',
      pricePerHour: complex.pricePerHour?.toString() || '',
      image: complex.image || '',
      location: complex.location || '',
      sports: complex.sports || [],
      featuresText: Array.isArray(complex.features) ? complex.features.join('\n') : ''
    });
    setShowComplexForm(true);
  };

  const handleDeleteComplex = async (complexId) => {
    const result = await Swal.fire({
      title: 'Delete Complex',
      text: 'Are you sure you want to delete this complex?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });
    if (!result.isConfirmed) return;
    try {
      await updateDoc(doc(db, 'complexes', complexId), { status: 'deleted', deletedAt: serverTimestamp() });
      fetchData();
    } catch (error) {
      console.error('Error deleting complex:', error);
    }
  };

  const handleAddSport = async () => {
    if (!newSportName.trim()) return;
    const sportName = newSportName.trim().toLowerCase();
    if (availableSports.some(s => s.toLowerCase() === sportName)) {
      Swal.fire({
        icon: 'warning',
        title: 'Sport Exists',
        text: 'This sport already exists',
        confirmButtonColor: '#10b981'
      });
      return;
    }
    try {
      await addDoc(collection(db, 'sports'), { name: sportName, createdAt: serverTimestamp() });
      setAvailableSports([...availableSports, sportName]);
      setNewSportName('');
    } catch (error) {
      console.error('Error adding sport:', error);
      Swal.fire({
        icon: 'error',
        title: 'Add Failed',
        text: 'Error adding sport. Please try again.',
        confirmButtonColor: '#10b981'
      });
    }
  };

  const handleSportToggle = (sport) => {
    const currentSports = complexForm.sports || [];
    if (currentSports.some(s => s.toLowerCase() === sport.toLowerCase())) {
      setComplexForm(prev => ({
        ...prev,
        sports: currentSports.filter(s => s.toLowerCase() !== sport.toLowerCase())
      }));
    } else {
      setComplexForm(prev => ({
        ...prev,
        sports: [...currentSports, sport]
      }));
    }
  };

  const handleAddEquipmentCategory = async () => {
    if (!newEquipmentCategoryName.trim()) return;
    const categoryName = newEquipmentCategoryName.trim().toLowerCase();
    if (availableEquipmentCategories.some(c => c.toLowerCase() === categoryName)) {
      Swal.fire({
        icon: 'warning',
        title: 'Category Exists',
        text: 'This category already exists',
        confirmButtonColor: '#10b981'
      });
      return;
    }
    try {
      await addDoc(collection(db, 'equipmentCategories'), { name: categoryName, createdAt: serverTimestamp() });
      setAvailableEquipmentCategories([...availableEquipmentCategories, categoryName]);
      setNewEquipmentCategoryName('');
    } catch (error) {
      console.error('Error adding equipment category:', error);
      Swal.fire({
        icon: 'error',
        title: 'Add Failed',
        text: 'Error adding category. Please try again.',
        confirmButtonColor: '#10b981'
      });
    }
  };

  const handleAddFoodCategory = async () => {
    if (!newFoodCategoryName.trim()) return;
    const categoryName = newFoodCategoryName.trim().toLowerCase();
    if (availableFoodCategories.some(c => c.toLowerCase() === categoryName)) {
      Swal.fire({
        icon: 'warning',
        title: 'Category Exists',
        text: 'This category already exists',
        confirmButtonColor: '#10b981'
      });
      return;
    }
    try {
      await addDoc(collection(db, 'foodCategories'), { name: categoryName, createdAt: serverTimestamp() });
      setAvailableFoodCategories([...availableFoodCategories, categoryName]);
      setNewFoodCategoryName('');
    } catch (error) {
      console.error('Error adding food category:', error);
      Swal.fire({
        icon: 'error',
        title: 'Add Failed',
        text: 'Error adding category. Please try again.',
        confirmButtonColor: '#10b981'
      });
    }
  };

  const handleCoachSubmit = async (e) => {
    e.preventDefault();
    try {
      const coachData = {
        name: coachForm.name,
        price: parseFloat(coachForm.price) || 0,
        complexId: coachForm.complexId,
        speciality: coachForm.speciality || '',
        bio: coachForm.bio || '',
        image: coachForm.image || '',
        experience: coachForm.experience || ''
      };

      if (editingCoach) {
        await updateDoc(doc(db, 'coaches', editingCoach.id), coachData);
      } else {
        await addDoc(collection(db, 'coaches'), {
          ...coachData,
          createdAt: serverTimestamp()
        });
      }

      setShowCoachForm(false);
      setEditingCoach(null);
      setCoachForm({ name: '', price: '', complexId: '', speciality: '', bio: '', image: '', experience: '' });
      fetchData();
    } catch (error) {
      console.error('Error saving coach:', error);
      Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: 'Error saving coach. Please try again.',
        confirmButtonColor: '#10b981'
      });
    }
  };

  const handleEditCoach = (coach) => {
    setEditingCoach(coach);
    setCoachForm({
      name: coach.name || '',
      price: coach.price?.toString() || '',
      complexId: coach.complexId || '',
      speciality: coach.speciality || '',
      bio: coach.bio || '',
      image: coach.image || '',
      experience: coach.experience || ''
    });
    setShowCoachForm(true);
  };

  const handleDeleteCoach = async (coachId) => {
    const result = await Swal.fire({
      title: 'Delete Coach',
      text: 'Are you sure you want to delete this coach?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });
    if (!result.isConfirmed) return;
    try {
      await updateDoc(doc(db, 'coaches', coachId), { status: 'deleted', deletedAt: serverTimestamp() });
      fetchData();
    } catch (error) {
      console.error('Error deleting coach:', error);
    }
  };

  const handleEquipmentSubmit = async (e) => {
    e.preventDefault();
    try {
      const equipmentData = {
        name: equipmentForm.name,
        category: equipmentForm.category,
        price: parseFloat(equipmentForm.price) || 0,
        description: equipmentForm.description || '',
        image: equipmentForm.image || ''
      };

      if (editingEquipment) {
        await updateDoc(doc(db, 'sportsItems', editingEquipment.id), equipmentData);
      } else {
        await addDoc(collection(db, 'sportsItems'), {
          ...equipmentData,
          createdAt: serverTimestamp()
        });
      }

      setShowEquipmentForm(false);
      setEditingEquipment(null);
      setEquipmentForm({ name: '', category: '', price: '', description: '', image: '' });
      fetchData();
    } catch (error) {
      console.error('Error saving equipment:', error);
      Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: 'Error saving equipment. Please try again.',
        confirmButtonColor: '#10b981'
      });
    }
  };

  const handleEditEquipment = (item) => {
    setEditingEquipment(item);
    setEquipmentForm({
      name: item.name || '',
      category: item.category || '',
      price: item.price?.toString() || '',
      description: item.description || '',
      image: item.image || ''
    });
    setShowEquipmentForm(true);
  };

  const handleDeleteEquipment = async (itemId) => {
    const result = await Swal.fire({
      title: 'Delete Equipment',
      text: 'Are you sure you want to delete this equipment item?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });
    if (!result.isConfirmed) return;
    try {
      await updateDoc(doc(db, 'sportsItems', itemId), { status: 'deleted', deletedAt: serverTimestamp() });
      fetchData();
    } catch (error) {
      console.error('Error deleting equipment:', error);
    }
  };

  const handleFoodSubmit = async (e) => {
    e.preventDefault();
    try {
      const foodData = {
        name: foodForm.name,
        category: foodForm.category,
        price: parseFloat(foodForm.price) || 0,
        description: foodForm.description || '',
        image: foodForm.image || ''
      };

      if (editingFood) {
        await updateDoc(doc(db, 'foodItems', editingFood.id), foodData);
      } else {
        await addDoc(collection(db, 'foodItems'), {
          ...foodData,
          createdAt: serverTimestamp()
        });
      }

      setShowFoodForm(false);
      setEditingFood(null);
      setFoodForm({ name: '', category: '', price: '', description: '', image: '' });
      fetchData();
    } catch (error) {
      console.error('Error saving food item:', error);
      Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: 'Error saving food item. Please try again.',
        confirmButtonColor: '#10b981'
      });
    }
  };

  const handleEditFood = (item) => {
    setEditingFood(item);
    setFoodForm({
      name: item.name || '',
      category: item.category || '',
      price: item.price?.toString() || '',
      description: item.description || '',
      image: item.image || ''
    });
    setShowFoodForm(true);
  };

  const handleDeleteFood = async (itemId) => {
    const result = await Swal.fire({
      title: 'Delete Food Item',
      text: 'Are you sure you want to delete this food item?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });
    if (!result.isConfirmed) return;
    try {
      await updateDoc(doc(db, 'foodItems', itemId), { status: 'deleted', deletedAt: serverTimestamp() });
      fetchData();
    } catch (error) {
      console.error('Error deleting food item:', error);
    }
  };

  // Pagination component
  const PaginationControls = ({ data, tab }) => {
    const totalPages = getTotalPages(data);
    const current = currentPage[tab] || 1;
    
    if (totalPages <= 1) return null;

    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, current - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-between mt-4 px-4 py-3 bg-white border-t border-gray-200">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => handlePageChange(tab, current - 1)}
            disabled={current === 1}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Previous
          </button>
          <button
            onClick={() => handlePageChange(tab, current + 1)}
            disabled={current === totalPages}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{(current - 1) * recordsPerPage + 1}</span> to{' '}
              <span className="font-medium">{Math.min(current * recordsPerPage, data.length)}</span> of{' '}
              <span className="font-medium">{data.length}</span> results
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(tab, current - 1)}
                disabled={current === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              {pages.map(page => (
                <button
                  key={page}
                  onClick={() => handlePageChange(tab, page)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    current === page
                      ? 'z-10 bg-primary border-primary text-white'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(tab, current + 1)}
                disabled={current === totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10l-3.293-3.293a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
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
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">All Bookings</h2>
                  </div>
                  
                  {/* Statistics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                          <p className="text-3xl font-bold text-gray-800 mt-2">{getBookingStats().total}</p>
                        </div>
                        <HiClipboard className="w-12 h-12 text-blue-500" />
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-yellow-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Pending</p>
                          <p className="text-3xl font-bold text-gray-800 mt-2">{getBookingStats().pending}</p>
                        </div>
                        <HiClock className="w-12 h-12 text-yellow-500" />
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Confirmed</p>
                          <p className="text-3xl font-bold text-gray-800 mt-2">{getBookingStats().confirmed}</p>
                        </div>
                        <HiCheck className="w-12 h-12 text-green-500" />
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Cancelled</p>
                          <p className="text-3xl font-bold text-gray-800 mt-2">{getBookingStats().cancelled}</p>
                        </div>
                        <HiX className="w-12 h-12 text-red-500" />
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">This Week</p>
                          <p className="text-3xl font-bold text-gray-800 mt-2">{getBookingStats().thisWeek}</p>
                          <p className="text-xs text-gray-500 mt-1">New bookings</p>
                        </div>
                        <HiTrendingUp className="w-12 h-12 text-purple-500" />
                      </div>
                    </div>
                  </div>

                  {/* Booking Filters */}
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                          value={bookingStatusFilter}
                          onChange={(e) => {
                            setBookingStatusFilter(e.target.value);
                            setCurrentPage(prev => ({ ...prev, bookings: 1 }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                        >
                          <option value="all">All</option>
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                          type="date"
                          value={bookingDateRangeStart}
                          onChange={(e) => {
                            setBookingDateRangeStart(e.target.value);
                            setCurrentPage(prev => ({ ...prev, bookings: 1 }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                          type="date"
                          value={bookingDateRangeEnd}
                          onChange={(e) => {
                            setBookingDateRangeEnd(e.target.value);
                            setCurrentPage(prev => ({ ...prev, bookings: 1 }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sport</label>
                        <select
                          value={bookingSportFilter}
                          onChange={(e) => {
                            setBookingSportFilter(e.target.value);
                            setCurrentPage(prev => ({ ...prev, bookings: 1 }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                        >
                          <option value="all">All Sports</option>
                          {[...new Set(bookings.map(b => b.sport).filter(Boolean))].map(sport => (
                            <option key={sport} value={sport}>{sport}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Bookings Table */}
                  {(() => {
                    const filteredBookings = getFilteredBookings();
                    const paginatedBookings = getPaginatedData(filteredBookings);
                    return (
                      <>
                    <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sport</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                              {paginatedBookings.length === 0 ? (
                                <tr>
                                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">No bookings found.</td>
                                </tr>
                              ) : (
                                paginatedBookings.map((booking) => (
                                  <tr key={booking.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                      {booking.id.substring(0, 8)}...
                              </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{booking.sport || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {booking.date?.toDate ? booking.date.toDate().toLocaleDateString() : booking.date || 'N/A'}
                              </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{booking.timeSlot || 'N/A'}</td>
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
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      setViewingRecord(booking);
                                      setViewModalType('booking');
                                    }}
                                    className="text-blue-600 hover:text-blue-900"
                                    title="View Details"
                                  >
                                    <HiEye className="w-5 h-5" />
                                  </button>
                                  {booking.status === 'pending' && (
                                    <>
                                      <button
                                        onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                                              className="text-green-600 hover:text-green-900"
                                              title="Confirm"
                                      >
                                              <HiCheckCircle className="w-5 h-5" />
                                      </button>
                                      <button
                                        onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                                              className="text-red-600 hover:text-red-900"
                                              title="Cancel"
                                      >
                                              <HiXCircle className="w-5 h-5" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                                ))
                              )}
                        </tbody>
                      </table>
                    </div>
                        <PaginationControls data={filteredBookings} tab="bookings" />
                      </>
                    );
                  })()}
                </div>
              )}

              {activeTab === 'complexes' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Sports Complexes</h2>
                    <button
                      onClick={() => {
                        setEditingComplex(null);
                        setComplexForm({ name: '', description: '', pricePerHour: '', image: '', location: '', sports: [], featuresText: '' });
                        setShowComplexForm(true);
                      }}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
                    >
                      Add Complex
                    </button>
                  </div>

                  {(() => {
                    const paginatedComplexes = getPaginatedData(complexes);
                    return (
                      <>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price/Hour</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sports</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {paginatedComplexes.length === 0 ? (
                                <tr>
                                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">No complexes found.</td>
                                </tr>
                              ) : (
                                paginatedComplexes.map((complex) => (
                                  <tr key={complex.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{complex.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{complex.location || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">£{complex.pricePerHour?.toFixed(2) || '0.00'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                      {Array.isArray(complex.sports) ? complex.sports.join(', ') : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => {
                                            setViewingRecord(complex);
                                            setViewModalType('complex');
                                          }}
                                          className="text-blue-600 hover:text-blue-900"
                                          title="View Details"
                                        >
                                          <HiEye className="w-5 h-5" />
                                        </button>
                                        <button
                                          onClick={() => handleEditComplex(complex)}
                                          className="text-green-600 hover:text-green-900"
                                          title="Edit"
                                        >
                                          <HiPencil className="w-5 h-5" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteComplex(complex.id)}
                                          className="text-red-600 hover:text-red-900"
                                          title="Delete"
                                        >
                                          <HiTrash className="w-5 h-5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                        <PaginationControls data={complexes} tab="complexes" />
                      </>
                    );
                  })()}

                  {/* Complex Form Modal */}
                  {showComplexForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                          <h3 className="text-2xl font-bold text-gray-800">{editingComplex ? 'Edit Complex' : 'Add Complex'}</h3>
                          <button
                            onClick={() => {
                              setShowComplexForm(false);
                              setEditingComplex(null);
                              setComplexForm({ name: '', description: '', pricePerHour: '', image: '', location: '', sports: [], featuresText: '' });
                            }}
                            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                          >
                            ×
                          </button>
                        </div>
                        <form onSubmit={handleComplexSubmit} className="p-6 space-y-4">
                          <div>
                            <label className="block text-gray-700 font-semibold mb-2">Name *</label>
                            <input
                              type="text"
                              required
                              value={complexForm.name}
                              onChange={(e) => setComplexForm({ ...complexForm, name: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-700 font-semibold mb-2">Description</label>
                            <textarea
                              value={complexForm.description}
                              onChange={(e) => setComplexForm({ ...complexForm, description: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                              rows="3"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-gray-700 font-semibold mb-2">Price Per Hour *</label>
                              <input
                                type="number"
                                required
                                step="0.01"
                                value={complexForm.pricePerHour}
                                onChange={(e) => setComplexForm({ ...complexForm, pricePerHour: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                              />
                            </div>
                            <div>
                              <label className="block text-gray-700 font-semibold mb-2">Location</label>
                              <input
                                type="text"
                                value={complexForm.location}
                                onChange={(e) => setComplexForm({ ...complexForm, location: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                              />
                            </div>
                            </div>
                            <div>
                              <label className="block text-gray-700 font-semibold mb-2">Image URL</label>
                              <input
                                type="url"
                                value={complexForm.image}
                                onChange={(e) => setComplexForm({ ...complexForm, image: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                              />
                          </div>
                          <div>
                            <label className="block text-gray-700 font-semibold mb-2">Sports *</label>
                            <div className="mb-3 flex gap-2">
                              <input
                                type="text"
                                value={newSportName}
                                onChange={(e) => setNewSportName(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddSport();
                                  }
                                }}
                                placeholder="Add new sport..."
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                              />
                              <button
                                type="button"
                                onClick={handleAddSport}
                                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition text-sm font-semibold"
                              >
                                Add Sport
                              </button>
                            </div>
                            <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto">
                              {availableSports.length === 0 ? (
                                <p className="text-gray-500 text-sm">Loading sports...</p>
                              ) : (
                                <div className="space-y-2">
                                  {availableSports.map((sport) => (
                                    <label key={sport} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                              <input
                                type="checkbox"
                                        checked={complexForm.sports?.some(s => s.toLowerCase() === sport.toLowerCase()) || false}
                                        onChange={() => handleSportToggle(sport)}
                                        className="mr-3 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                                      />
                                      <span className="text-gray-700 capitalize">{sport}</span>
                            </label>
                                  ))}
                          </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <label className="block text-gray-700 font-semibold mb-2">Features/Amenities (one per line)</label>
                            <textarea
                              value={complexForm.featuresText}
                              onChange={(e) => setComplexForm({ ...complexForm, featuresText: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                              rows="4"
                              placeholder="Enter features, one per line..."
                            />
                          </div>
                          <div className="flex gap-4 pt-4">
                            <button
                              type="button"
                              onClick={() => {
                                setShowComplexForm(false);
                                setEditingComplex(null);
                                setComplexForm({ name: '', description: '', pricePerHour: '', image: '', location: '', sports: [], featuresText: '' });
                              }}
                              className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="flex-1 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold"
                            >
                              {editingComplex ? 'Update Complex' : 'Add Complex'}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                    </div>
                  )}

              {activeTab === 'coaches' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Coaches</h2>
                    <button
                      onClick={() => {
                        setEditingCoach(null);
                        setCoachForm({ name: '', price: '', complexId: '', speciality: '', bio: '', image: '', experience: '' });
                        setShowCoachForm(true);
                      }}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
                    >
                      Add Coach
                    </button>
                  </div>

                  {(() => {
                    const paginatedCoaches = getPaginatedData(coaches);
                    return (
                      <>
                    <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Speciality</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                              {paginatedCoaches.length === 0 ? (
                                <tr>
                                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">No coaches found.</td>
                                </tr>
                              ) : (
                                paginatedCoaches.map((coach) => (
                                  <tr key={coach.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{coach.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{coach.speciality || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">£{coach.price?.toFixed(2) || '0.00'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex gap-2">
                                        <button
                                          onClick={() => {
                                            setViewingRecord(coach);
                                            setViewModalType('coach');
                                          }}
                                          className="text-blue-600 hover:text-blue-900"
                                          title="View Details"
                                        >
                                          <HiEye className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleEditCoach(coach)} className="text-green-600 hover:text-green-900" title="Edit">
                                          <HiPencil className="w-5 h-5" />
                                  </button>
                                        <button onClick={() => handleDeleteCoach(coach.id)} className="text-red-600 hover:text-red-900" title="Delete">
                                          <HiTrash className="w-5 h-5" />
                                  </button>
                                  </div>
                              </td>
                            </tr>
                                ))
                              )}
                        </tbody>
                      </table>
                                </div>
                        <PaginationControls data={coaches} tab="coaches" />
                      </>
                    );
                  })()}

                  {/* Coach Form Modal */}
                  {showCoachForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                          <h3 className="text-2xl font-bold text-gray-800">{editingCoach ? 'Edit Coach' : 'Add Coach'}</h3>
                                  <button
                            onClick={() => {
                              setShowCoachForm(false);
                              setEditingCoach(null);
                              setCoachForm({ name: '', price: '', complexId: '', speciality: '', bio: '', image: '', experience: '' });
                            }}
                            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                          >
                            ×
                                  </button>
                        </div>
                        <form onSubmit={handleCoachSubmit} className="p-6 space-y-4">
                          <div>
                            <label className="block text-gray-700 font-semibold mb-2">Name *</label>
                            <input
                              type="text"
                              required
                              value={coachForm.name}
                              onChange={(e) => setCoachForm({ ...coachForm, name: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-gray-700 font-semibold mb-2">Price *</label>
                              <input
                                type="number"
                                required
                                step="0.01"
                                value={coachForm.price}
                                onChange={(e) => setCoachForm({ ...coachForm, price: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                              />
                            </div>
                            <div>
                              <label className="block text-gray-700 font-semibold mb-2">Complex</label>
                              <select
                                value={coachForm.complexId}
                                onChange={(e) => setCoachForm({ ...coachForm, complexId: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                              >
                                <option value="">Select a complex</option>
                                {complexes.filter(c => c.status !== 'deleted').map((complex) => (
                                  <option key={complex.id} value={complex.id}>
                                    {complex.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-gray-700 font-semibold mb-2">Speciality</label>
                            <input
                              type="text"
                              value={coachForm.speciality}
                              onChange={(e) => setCoachForm({ ...coachForm, speciality: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                              placeholder="e.g., Football, Basketball"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-700 font-semibold mb-2">Experience</label>
                            <input
                              type="text"
                              value={coachForm.experience}
                              onChange={(e) => setCoachForm({ ...coachForm, experience: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                              placeholder="e.g., 5 years, Professional player"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-700 font-semibold mb-2">Bio</label>
                            <textarea
                              value={coachForm.bio}
                              onChange={(e) => setCoachForm({ ...coachForm, bio: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                              rows="4"
                              placeholder="Tell us about the coach..."
                            />
                          </div>
                          <div>
                            <label className="block text-gray-700 font-semibold mb-2">Image URL</label>
                            <input
                              type="url"
                              value={coachForm.image}
                              onChange={(e) => setCoachForm({ ...coachForm, image: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                            />
                          </div>
                          <div className="flex gap-4 pt-4">
                                  <button
                              type="button"
                              onClick={() => {
                                setShowCoachForm(false);
                                setEditingCoach(null);
                                setCoachForm({ name: '', price: '', complexId: '', speciality: '', bio: '', image: '', experience: '' });
                              }}
                              className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                            >
                              Cancel
                                  </button>
                                  <button
                              type="submit"
                              className="flex-1 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold"
                                  >
                              {editingCoach ? 'Update Coach' : 'Add Coach'}
                                  </button>
                                </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'users' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">All Users</h2>
                  </div>
                  
                  {/* User Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Users</p>
                          <p className="text-3xl font-bold text-gray-800 mt-2">{getUserStats().total}</p>
                        </div>
                        <HiUsers className="w-12 h-12 text-blue-500" />
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Active</p>
                          <p className="text-3xl font-bold text-gray-800 mt-2">{getUserStats().active}</p>
                          <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
                        </div>
                        <HiCheck className="w-12 h-12 text-green-500" />
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-gray-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Inactive</p>
                          <p className="text-3xl font-bold text-gray-800 mt-2">{getUserStats().inactive}</p>
                        </div>
                        <HiX className="w-12 h-12 text-gray-500" />
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">This Week</p>
                          <p className="text-3xl font-bold text-gray-800 mt-2">{getUserStats().thisWeek}</p>
                          <p className="text-xs text-gray-500 mt-1">New users</p>
                        </div>
                        <HiTrendingUp className="w-12 h-12 text-purple-500" />
                      </div>
                    </div>
                  </div>

                  {(() => {
                    const paginatedUsers = getPaginatedData(users);
                    return (
                      <>
                    <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                              {paginatedUsers.length === 0 ? (
                                <tr>
                                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">No users found.</td>
                                </tr>
                              ) : (
                                paginatedUsers.map((u) => (
                                  <tr key={u.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.name || 'No name'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                        u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                                      }`}>
                                        {u.role || 'user'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex gap-2">
                                  <button
                                          onClick={() => {
                                            setViewingRecord(u);
                                            setViewModalType('user');
                                          }}
                                          className="text-blue-600 hover:text-blue-900"
                                          title="View Details"
                                        >
                                          <HiEye className="w-5 h-5" />
                                  </button>
                                        <button onClick={() => handleDeleteUser(u.id)} className="text-red-600 hover:text-red-900" title="Delete">
                                          <HiTrash className="w-5 h-5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                                ))
                              )}
                        </tbody>
                      </table>
                    </div>
                        <PaginationControls data={users} tab="users" />
                      </>
                    );
                  })()}
                </div>
              )}

              {activeTab === 'equipment' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Equipment Shop</h2>
                    <button
                      onClick={() => {
                        setEditingEquipment(null);
                        setEquipmentForm({ name: '', category: '', price: '', description: '', image: '' });
                        setShowEquipmentForm(true);
                      }}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
                    >
                      Add Equipment
                    </button>
                  </div>

                  {/* Equipment Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Items</p>
                          <p className="text-3xl font-bold text-gray-800 mt-2">{getEquipmentStats().total}</p>
                        </div>
                        <HiShoppingBag className="w-12 h-12 text-blue-500" />
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Categories</p>
                          <p className="text-3xl font-bold text-gray-800 mt-2">{getEquipmentStats().categories}</p>
                        </div>
                        <HiFolder className="w-12 h-12 text-green-500" />
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">This Week</p>
                          <p className="text-3xl font-bold text-gray-800 mt-2">{getEquipmentStats().thisWeek}</p>
                          <p className="text-xs text-gray-500 mt-1">New items added</p>
                        </div>
                        <HiTrendingUp className="w-12 h-12 text-purple-500" />
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-orange-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Avg. Price</p>
                          <p className="text-3xl font-bold text-gray-800 mt-2">£{getEquipmentStats().averagePrice}</p>
                        </div>
                        <HiTrendingUp className="w-12 h-12 text-orange-500" />
                      </div>
                    </div>
                  </div>

                  {(() => {
                    const paginatedItems = getPaginatedData(sportsItems);
                    return (
                      <>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {paginatedItems.length === 0 ? (
                                <tr>
                                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">No equipment found.</td>
                                </tr>
                              ) : (
                                paginatedItems.map((item) => (
                                  <tr key={item.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{item.category || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">£{item.price?.toFixed(2) || '0.00'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                      <div className="flex gap-2">
                          <button
                                          onClick={() => {
                                            setViewingRecord(item);
                                            setViewModalType('equipment');
                                          }}
                                          className="text-blue-600 hover:text-blue-900"
                                          title="View Details"
                                        >
                                          <HiEye className="w-5 h-5" />
                          </button>
                                        <button onClick={() => handleEditEquipment(item)} className="text-green-600 hover:text-green-900" title="Edit">
                                          <HiPencil className="w-5 h-5" />
                            </button>
                                        <button onClick={() => handleDeleteEquipment(item.id)} className="text-red-600 hover:text-red-900" title="Delete">
                                          <HiTrash className="w-5 h-5" />
                            </button>
                        </div>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                        <PaginationControls data={sportsItems} tab="equipment" />
                      </>
                    );
                  })()}

                  {/* Equipment Form Modal */}
                  {showEquipmentForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                          <h3 className="text-2xl font-bold text-gray-800">{editingEquipment ? 'Edit Equipment' : 'Add Equipment'}</h3>
                          <button
                            onClick={() => {
                              setShowEquipmentForm(false);
                              setEditingEquipment(null);
                              setEquipmentForm({ name: '', category: '', price: '', description: '', image: '' });
                            }}
                            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                          >
                            ×
                          </button>
                        </div>
                        <form onSubmit={handleEquipmentSubmit} className="p-6 space-y-4">
                            <div>
                              <label className="block text-gray-700 font-semibold mb-2">Name *</label>
                              <input
                                type="text"
                                required
                                value={equipmentForm.name}
                                onChange={(e) => setEquipmentForm({ ...equipmentForm, name: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                              />
                            </div>
                            <div>
                              <label className="block text-gray-700 font-semibold mb-2">Category *</label>
                              <div className="space-y-2">
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={newEquipmentCategoryName}
                                    onChange={(e) => setNewEquipmentCategoryName(e.target.value)}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddEquipmentCategory();
                                      }
                                    }}
                                    placeholder="Add new category..."
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                                  />
                                  <button
                                    type="button"
                                    onClick={handleAddEquipmentCategory}
                                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition text-sm font-semibold"
                                  >
                                    Add
                                  </button>
                                </div>
                                <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto">
                                  {availableEquipmentCategories.length === 0 ? (
                                    <p className="text-gray-500 text-sm">No categories available. Add one above.</p>
                                  ) : (
                                    <div className="space-y-2">
                                      {availableEquipmentCategories.map((category) => (
                                        <label key={category} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                                          <input
                                            type="radio"
                                            name="equipmentCategory"
                                            required
                                            checked={equipmentForm.category?.toLowerCase() === category.toLowerCase()}
                                            onChange={() => setEquipmentForm({ ...equipmentForm, category: category })}
                                            className="mr-3 w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                                          />
                                          <span className="text-gray-700 capitalize">{category}</span>
                                        </label>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-gray-700 font-semibold mb-2">Price *</label>
                              <input
                                type="number"
                                required
                                step="0.01"
                                min="0"
                                value={equipmentForm.price}
                                onChange={(e) => setEquipmentForm({ ...equipmentForm, price: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                              />
                            </div>
                            </div>
                            <div>
                            <label className="block text-gray-700 font-semibold mb-2">Description</label>
                            <textarea
                              value={equipmentForm.description}
                              onChange={(e) => setEquipmentForm({ ...equipmentForm, description: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                              rows="3"
                              />
                            </div>
                            <div>
                              <label className="block text-gray-700 font-semibold mb-2">Image URL</label>
                              <input
                                type="url"
                                value={equipmentForm.image}
                                onChange={(e) => setEquipmentForm({ ...equipmentForm, image: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                              />
                            </div>
                          <div className="flex gap-4 pt-4">
                            <button
                              type="button"
                              onClick={() => {
                                setShowEquipmentForm(false);
                                setEditingEquipment(null);
                                setEquipmentForm({ name: '', category: '', price: '', description: '', image: '' });
                              }}
                              className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                            >
                              Cancel
                            </button>
                                  <button
                              type="submit"
                              className="flex-1 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold"
                            >
                              {editingEquipment ? 'Update Equipment' : 'Add Equipment'}
                                  </button>
                                </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'restaurant' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Restaurant</h2>
                    <button
                      onClick={() => {
                        setEditingFood(null);
                        setFoodForm({ name: '', category: '', price: '', description: '', image: '' });
                        setShowFoodForm(true);
                      }}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
                    >
                      Add Food Item
                    </button>
                  </div>

                  {/* Food Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Items</p>
                          <p className="text-3xl font-bold text-gray-800 mt-2">{getFoodStats().total}</p>
                        </div>
                        <HiEmojiHappy className="w-12 h-12 text-red-500" />
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Categories</p>
                          <p className="text-3xl font-bold text-gray-800 mt-2">{getFoodStats().categories}</p>
                          <p className="text-xs text-gray-500 mt-1">Food, Drinks, etc.</p>
                        </div>
                        <HiFolder className="w-12 h-12 text-green-500" />
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">This Week</p>
                          <p className="text-3xl font-bold text-gray-800 mt-2">{getFoodStats().thisWeek}</p>
                          <p className="text-xs text-gray-500 mt-1">New items added</p>
                        </div>
                        <HiTrendingUp className="w-12 h-12 text-purple-500" />
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-orange-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Avg. Price</p>
                          <p className="text-3xl font-bold text-gray-800 mt-2">£{getFoodStats().averagePrice}</p>
                        </div>
                        <HiTrendingUp className="w-12 h-12 text-orange-500" />
                      </div>
                    </div>
                  </div>

                  {(() => {
                    const paginatedFood = getPaginatedData(foodItems);
                    return (
                      <>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {paginatedFood.length === 0 ? (
                                <tr>
                                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">No food items found.</td>
                                </tr>
                              ) : (
                                paginatedFood.map((item) => (
                                  <tr key={item.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{item.category || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">£{item.price?.toFixed(2) || '0.00'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                      <div className="flex gap-2">
                          <button
                                          onClick={() => {
                                            setViewingRecord(item);
                                            setViewModalType('food');
                                          }}
                                          className="text-blue-600 hover:text-blue-900"
                                          title="View Details"
                                        >
                                          <HiEye className="w-5 h-5" />
                          </button>
                                        <button onClick={() => handleEditFood(item)} className="text-green-600 hover:text-green-900" title="Edit">
                                          <HiPencil className="w-5 h-5" />
                          </button>
                                        <button onClick={() => handleDeleteFood(item.id)} className="text-red-600 hover:text-red-900" title="Delete">
                                          <HiTrash className="w-5 h-5" />
                          </button>
                        </div>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                        <PaginationControls data={foodItems} tab="restaurant" />
                      </>
                    );
                  })()}

                  {/* Food Form Modal */}
                  {showFoodForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                          <h3 className="text-2xl font-bold text-gray-800">{editingFood ? 'Edit Food Item' : 'Add Food Item'}</h3>
                          <button
                            onClick={() => {
                              setShowFoodForm(false);
                              setEditingFood(null);
                              setFoodForm({ name: '', category: '', price: '', description: '', image: '' });
                            }}
                            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                          >
                            ×
                          </button>
                        </div>
                        <form onSubmit={handleFoodSubmit} className="p-6 space-y-4">
                            <div>
                              <label className="block text-gray-700 font-semibold mb-2">Name *</label>
                              <input
                                type="text"
                                required
                                value={foodForm.name}
                                onChange={(e) => setFoodForm({ ...foodForm, name: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                              />
                            </div>
                            <div>
                            <label className="block text-gray-700 font-semibold mb-2">Category *</label>
                            <div className="space-y-2">
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={newFoodCategoryName}
                                  onChange={(e) => setNewFoodCategoryName(e.target.value)}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleAddFoodCategory();
                                    }
                                  }}
                                  placeholder="Add new category..."
                                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                                />
                                <button
                                  type="button"
                                  onClick={handleAddFoodCategory}
                                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition text-sm font-semibold"
                                >
                                  Add
                                </button>
                              </div>
                              <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto">
                                {availableFoodCategories.length === 0 ? (
                                  <p className="text-gray-500 text-sm">No categories available. Add one above.</p>
                                ) : (
                                  <div className="space-y-2">
                                    {availableFoodCategories.map((category) => (
                                      <label key={category} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                                        <input
                                          type="radio"
                                          name="foodCategory"
                                          required
                                          checked={foodForm.category?.toLowerCase() === category.toLowerCase()}
                                          onChange={() => setFoodForm({ ...foodForm, category: category })}
                                          className="mr-3 w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                                        />
                                        <span className="text-gray-700 capitalize">{category}</span>
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div>
                            <label className="block text-gray-700 font-semibold mb-2">Price *</label>
                              <input
                                type="number"
                                required
                              step="0.01"
                              min="0"
                                value={foodForm.price}
                                onChange={(e) => setFoodForm({ ...foodForm, price: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                              />
                            </div>
                            <div>
                            <label className="block text-gray-700 font-semibold mb-2">Description</label>
                            <textarea
                              value={foodForm.description}
                              onChange={(e) => setFoodForm({ ...foodForm, description: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                              rows="3"
                              />
                            </div>
                            <div>
                              <label className="block text-gray-700 font-semibold mb-2">Image URL</label>
                              <input
                                type="url"
                                value={foodForm.image}
                                onChange={(e) => setFoodForm({ ...foodForm, image: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                              />
                            </div>
                          <div className="flex gap-4 pt-4">
                            <button
                              type="button"
                              onClick={() => {
                                setShowFoodForm(false);
                                setEditingFood(null);
                                setFoodForm({ name: '', category: '', price: '', description: '', image: '' });
                              }}
                              className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                            >
                              Cancel
                            </button>
                                  <button
                              type="submit"
                              className="flex-1 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold"
                            >
                              {editingFood ? 'Update Food Item' : 'Add Food Item'}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                    </div>
                  )}

              {activeTab === 'restaurantPurchases' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Restaurant Purchases</h2>
                  </div>

                  {(() => {
                    const purchasePage = currentPage['restaurantPurchases'] || 1;
                    const startIndex = (purchasePage - 1) * recordsPerPage;
                    const endIndex = startIndex + recordsPerPage;
                    const paginatedPurchases = restaurantPurchases.slice(startIndex, endIndex);
                    const totalPurchasePages = Math.ceil(restaurantPurchases.length / recordsPerPage);
                    
                    return (
                      <>
                    <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchase ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Complex</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                              {paginatedPurchases.length === 0 ? (
                                <tr>
                                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">No restaurant purchases found.</td>
                                </tr>
                              ) : (
                                paginatedPurchases.map((purchase) => (
                                  <tr key={purchase.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                      {purchase.id.substring(0, 8)}...
                              </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {purchase.complex?.name || 'N/A'}
                              </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                      {purchase.items?.length || 0} item{purchase.items?.length !== 1 ? 's' : ''}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      £{purchase.total?.toFixed(2) || '0.00'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {purchase.createdAt?.toDate ? purchase.createdAt.toDate().toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                        purchase.status === 'confirmed' 
                                          ? 'bg-green-100 text-green-800' 
                                          : purchase.status === 'pending'
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : 'bg-red-100 text-red-800'
                                      }`}>
                                        {purchase.status || 'pending'}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => {
                                            setViewingRecord(purchase);
                                            setViewModalType('restaurantPurchase');
                                          }}
                                          className="text-blue-600 hover:text-blue-900"
                                          title="View Details"
                                        >
                                          <HiEye className="w-5 h-5" />
                                        </button>
                                        {purchase.status === 'pending' && (
                                          <>
                                            <button
                                              onClick={() => updateRestaurantPurchaseStatus(purchase.id, 'confirmed')}
                                              className="text-green-600 hover:text-green-900"
                                              title="Confirm"
                                            >
                                              <HiCheckCircle className="w-5 h-5" />
                                            </button>
                                            <button
                                              onClick={() => updateRestaurantPurchaseStatus(purchase.id, 'cancelled')}
                                              className="text-red-600 hover:text-red-900"
                                              title="Cancel"
                                            >
                                              <HiXCircle className="w-5 h-5" />
                                            </button>
                                          </>
                                        )}
                                </div>
                              </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                                </div>
                        {totalPurchasePages > 1 && (
                          <div className="flex justify-between items-center mt-4">
                            <button
                              onClick={() => handlePageChange('restaurantPurchases', Math.max(1, purchasePage - 1))}
                              disabled={purchasePage === 1}
                              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Previous
                            </button>
                            <span className="text-gray-600">
                              Page {purchasePage} of {totalPurchasePages}
                            </span>
                            <button
                              onClick={() => handlePageChange('restaurantPurchases', Math.min(totalPurchasePages, purchasePage + 1))}
                              disabled={purchasePage === totalPurchasePages}
                              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              {activeTab === 'equipmentPurchases' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Equipment Purchases</h2>
                  </div>

                  {(() => {
                    const purchasePage = currentPage['equipmentPurchases'] || 1;
                    const startIndex = (purchasePage - 1) * recordsPerPage;
                    const endIndex = startIndex + recordsPerPage;
                    const paginatedPurchases = equipmentPurchases.slice(startIndex, endIndex);
                    const totalPurchasePages = Math.ceil(equipmentPurchases.length / recordsPerPage);
                    
                    return (
                      <>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchase ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Complex</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {paginatedPurchases.length === 0 ? (
                                <tr>
                                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">No equipment purchases found.</td>
                                </tr>
                              ) : (
                                paginatedPurchases.map((purchase) => (
                                  <tr key={purchase.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                      {purchase.id.substring(0, 8)}...
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {purchase.complex?.name || (purchase.complexId ? `Complex ID: ${purchase.complexId.substring(0, 8)}...` : 'N/A')}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                      {purchase.items?.length || 0} item{purchase.items?.length !== 1 ? 's' : ''}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      £{purchase.total?.toFixed(2) || '0.00'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {purchase.createdAt?.toDate ? purchase.createdAt.toDate().toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                        purchase.status === 'confirmed' 
                                          ? 'bg-green-100 text-green-800' 
                                          : purchase.status === 'pending'
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : 'bg-red-100 text-red-800'
                                      }`}>
                                        {purchase.status || 'pending'}
                                      </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex gap-2">
                                  <button
                                          onClick={() => {
                                            setViewingRecord(purchase);
                                            setViewModalType('equipmentPurchase');
                                          }}
                                          className="text-blue-600 hover:text-blue-900"
                                          title="View Details"
                                        >
                                          <HiEye className="w-5 h-5" />
                                  </button>
                                        {purchase.status === 'pending' && (
                                          <>
                                  <button
                                              onClick={() => updateEquipmentPurchaseStatus(purchase.id, 'confirmed')}
                                              className="text-green-600 hover:text-green-900"
                                              title="Confirm"
                                  >
                                              <HiCheckCircle className="w-5 h-5" />
                                  </button>
                                            <button
                                              onClick={() => updateEquipmentPurchaseStatus(purchase.id, 'cancelled')}
                                              className="text-red-600 hover:text-red-900"
                                              title="Cancel"
                                            >
                                              <HiXCircle className="w-5 h-5" />
                                            </button>
                                          </>
                                        )}
                                </div>
                              </td>
                            </tr>
                                ))
                              )}
                        </tbody>
                      </table>
                        </div>
                        {totalPurchasePages > 1 && (
                          <div className="flex justify-between items-center mt-4">
                            <button
                              onClick={() => handlePageChange('equipmentPurchases', Math.max(1, purchasePage - 1))}
                              disabled={purchasePage === 1}
                              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Previous
                            </button>
                            <span className="text-gray-600">
                              Page {purchasePage} of {totalPurchasePages}
                            </span>
                            <button
                              onClick={() => handlePageChange('equipmentPurchases', Math.min(totalPurchasePages, purchasePage + 1))}
                              disabled={purchasePage === totalPurchasePages}
                              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Next
                            </button>
                    </div>
                  )}
                      </>
                    );
                  })()}
                </div>
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
                      <p className="text-gray-800 capitalize">{viewingRecord.package || 'Normal'}</p>
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
